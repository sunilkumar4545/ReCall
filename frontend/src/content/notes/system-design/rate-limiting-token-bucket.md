---
title: Token Bucket Rate Limiting Algorithm
category: system-design
summary: Low-latency distributed rate limiting algorithm using Redis atomic EVAL scripts.
code_language: lua
read_time: 5 min
youtube_url: ""
---

## Explanation
The **Token Bucket** algorithm is the industry standard for API rate limiting (used by Stripe, AWS, and Cloudflare). It allows bursts of traffic while guaranteeing a steady-state average rate:

- Tokens are added to a bucket of capacity `B` at a constant refill rate `R` (tokens per second).
- Each incoming API request attempts to draw `1` token from the bucket.
- If tokens are available, the request is allowed immediately. If the bucket is empty, the request is rejected with `HTTP 429 Too Many Requests`.

Instead of running background daemon timers to refill tokens, real-world systems calculate tokens lazily on each request:
`tokens = min(capacity, last_tokens + (now - last_refill_time) * refill_rate)`.

In distributed systems, this check-and-decrement operation is executed atomically in Redis using a Lua script to eliminate race conditions.

## Code
```lua
-- Atomic Redis Token Bucket Script (KEYS[1] = bucket_key, ARGV = [capacity, refill_rate, now, requested])
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'tokens', 'last_refill')
local last_tokens = tonumber(data[1]) or capacity
local last_refill = tonumber(data[2]) or now

-- Calculate lazily accumulated tokens since last request
local elapsed = math.max(0, now - last_refill)
local current_tokens = math.min(capacity, last_tokens + elapsed * refill_rate)

if current_tokens >= requested then
    current_tokens = current_tokens - requested
    redis.call('HMSET', key, 'tokens', current_tokens, 'last_refill', now)
    redis.call('EXPIRE', key, math.ceil(capacity / refill_rate))
    return 1 -- Allowed
else
    return 0 -- Rate Limited (HTTP 429)
end
```

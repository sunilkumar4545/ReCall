import os
import sys
import re
import time
import hashlib
import asyncio
from datetime import datetime, timezone
from collections import deque
import requests
from dotenv import load_dotenv
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from telethon.tl.types import Channel, Chat, MessageEntityTextUrl, MessageEntityUrl

# Path to backend/.env
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
load_dotenv(env_path)

API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')
SESSION_STRING = os.getenv('TELEGRAM_SESSION_STRING')
BACKEND_BASE_URL = os.getenv('RECALL_BACKEND_BASE_URL', 'http://localhost:8080/api/jobs')
BACKEND_INGEST_URL = f"{BACKEND_BASE_URL}/ingest"
BACKEND_STATUS_URL = f"{BACKEND_BASE_URL}/stream-status"

if not API_ID or not API_HASH or not SESSION_STRING:
    print("[ERROR] Missing TELEGRAM_API_ID, TELEGRAM_API_HASH, or TELEGRAM_SESSION_STRING in backend/.env")
    sys.exit(1)

# In-memory local buffer for Eco Mode (saves compute by buffering jobs when Neon is asleep)
local_job_buffer = deque(maxlen=150)

# Keywords indicating a job/hiring post
JOB_KEYWORDS = {
    'hiring', 'job', 'role', 'apply', 'internship', 'intern', 'developer',
    'engineer', 'opening', 'openings', 'ctc', 'lpa', 'salary', 'experience',
    'freshers', 'fresher', 'batch', 'fulltime', 'full-time', 'remote',
    'hybrid', 'walkin', 'walk-in', 'careers', 'opportunity', 'requirements'
}

# Domains to ignore for apply URL (socials/promo)
IGNORED_DOMAINS = [
    't.me/joinchat', 't.me/+', 'youtube.com', 'youtu.be',
    'instagram.com', 'facebook.com', 'twitter.com', 'x.com',
    'whatsapp.com', 'discord.gg'
]

def extract_urls(message):
    """Extract clean application URLs from text and Telegram message entities without UTF-16 offset distortion."""
    urls = []
    text = message.text or message.caption or ""

    # 1. First check MessageEntityTextUrl (where URL is explicitly stored in ent.url)
    if message.entities:
        for ent in message.entities:
            if isinstance(ent, MessageEntityTextUrl) and getattr(ent, 'url', None):
                urls.append(ent.url)

    # 2. Pure Regex extraction over full text (immune to UTF-16 emoji offset issues)
    raw_urls = re.findall(r'https?://[^\s<>"\'\)\]\}]+', text)
    urls.extend(raw_urls)

    # Clean & validate URLs
    valid_urls = []
    for u in urls:
        # Strip trailing markdown/punctuation
        clean = u.strip().rstrip('.,;()[]{}*_\n\r\t ')
        if not clean.startswith('http'):
            clean = 'https://' + clean.lstrip('/')

        # Filter out invite links and non-apply socials
        clean_lower = clean.lower()
        if not any(ign in clean_lower for ign in IGNORED_DOMAINS):
            if '.' in clean and len(clean) > 8:
                valid_urls.append(clean)

    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for u in valid_urls:
        if u not in seen:
            seen.add(u)
            deduped.append(u)

    return deduped

def parse_job_details(text, channel_title=""):
    """Heuristic extraction of Title, Company, Location, Description."""
    lines = [l.strip() for l in (text or '').splitlines() if l.strip()]
    if not lines:
        return None

    title = None
    company = None
    location = None

    # Line-by-line inspection
    for line in lines:
        lower = line.lower()
        if re.search(r'^(role|position|profile|title|job title)\s*[:\-]\s*', lower):
            title = re.sub(r'^(role|position|profile|title|job title)\s*[:\-]\s*', '', line, flags=re.IGNORECASE).strip()
        elif re.search(r'^(company|hiring company|organization|org)\s*[:\-]\s*', lower):
            company = re.sub(r'^(company|hiring company|organization|org)\s*[:\-]\s*', '', line, flags=re.IGNORECASE).strip()
        elif re.search(r'^(location|job location|work location)\s*[:\-]\s*', lower):
            location = re.sub(r'^(location|job location|work location)\s*[:\-]\s*', '', line, flags=re.IGNORECASE).strip()

    # Fallback heuristics for Title
    if not title:
        # Check first 2 lines
        for l in lines[:2]:
            clean = re.sub(r'[🚨📢🔥⭐💼⚡]', '', l).strip()
            if len(clean) > 5 and len(clean) < 100 and not clean.startswith('http'):
                title = clean
                break

    if not title:
        title = lines[0][:80] if lines else "New Job Opening"

    # Fallback heuristics for Location
    if not location:
        if re.search(r'\b(remote|work from home|wfh)\b', text, re.IGNORECASE):
            location = "Remote"
        elif re.search(r'\b(hybrid)\b', text, re.IGNORECASE):
            location = "Hybrid"
        elif re.search(r'\b(bangalore|bengaluru)\b', text, re.IGNORECASE):
            location = "Bangalore"
        elif re.search(r'\b(hyderabad)\b', text, re.IGNORECASE):
            location = "Hyderabad"
        elif re.search(r'\b(pune)\b', text, re.IGNORECASE):
            location = "Pune"
        elif re.search(r'\b(noida|gurgaon|gurugram|delhi)\b', text, re.IGNORECASE):
            location = "Delhi-NCR"
        elif re.search(r'\b(india)\b', text, re.IGNORECASE):
            location = "India"
        else:
            location = "Not Specified"

    # Clean description snippet (up to 350 chars)
    snippet = " ".join(lines)[:350]
    snippet = re.sub(r'\s+', ' ', snippet)

    return {
        'title': title[:250],
        'company': (company or channel_title or "Direct Hiring")[:140],
        'location': location[:90],
        'description': snippet
    }

def post_job_to_backend(payload):
    """Deliver extracted job to Spring Boot backend, or buffer locally in Eco Mode."""
    try:
        res = requests.post(BACKEND_INGEST_URL, json=payload, timeout=5)
        if res.status_code in (200, 201):
            print(f" [INGESTED] {payload['title']} | {payload['company']} -> 201 Created")
            return True
        elif res.status_code == 202:
            # Backend is in Eco Mode (PAUSED_TO_SAVE_COMPUTE). Buffer in Python RAM without touching Neon DB!
            local_job_buffer.append(payload)
            print(f" [ECO MODE] Neon asleep (0 CU-hrs). Buffered in RAM: {payload['title'][:40]}... (Buffered: {len(local_job_buffer)})")
            return True
        else:
            print(f" [BACKEND] Status {res.status_code}: {res.text[:120]}")
    except requests.exceptions.ConnectionError:
        local_job_buffer.append(payload)
        print(" [BUFFERED] Backend not reachable at http://localhost:8080. Kept in memory buffer.")
    except Exception as e:
        local_job_buffer.append(payload)
        print(f" [ERROR] Ingestion error: {e}")
    return False

def process_message(message, chat_title, chat_username):
    """Analyze a Telegram message and ingest if it contains a job posting."""
    text = message.text or message.caption or ""
    if not text:
        return

    lower_text = text.lower()
    matches = sum(1 for kw in JOB_KEYWORDS if kw in lower_text)
    if matches < 2:
        return # Not a job post

    urls = extract_urls(message)
    if not urls:
        return # No apply link found

    apply_url = urls[0]
    parsed = parse_job_details(text, chat_title)
    if not parsed:
        return

    content_hash = hashlib.sha256(apply_url.encode('utf-8')).hexdigest()

    posted_at = message.date.astimezone(timezone.utc).isoformat() if message.date else datetime.now(timezone.utc).isoformat()

    payload = {
        'title': parsed['title'],
        'company': parsed['company'],
        'location': parsed['location'],
        'applyUrl': apply_url,
        'description': parsed['description'],
        'channelTitle': chat_title,
        'channelUsername': chat_username,
        'postedAt': posted_at,
        'contentHash': content_hash
    }

    post_job_to_backend(payload)

client = TelegramClient(StringSession(SESSION_STRING), int(API_ID), API_HASH)

@client.on(events.NewMessage(incoming=True))
async def on_new_message(event):
    """Real-time event listener for all incoming channel / group messages."""
    try:
        chat = await event.get_chat()
        chat_title = getattr(chat, 'title', None) or getattr(chat, 'first_name', 'Telegram Channel')
        chat_username = getattr(chat, 'username', None) or ""
        
        process_message(event.message, chat_title, chat_username)
    except Exception as e:
        pass

async def backfill_recent_jobs():
    """Scan the last 5 messages of all joined channels to populate fresh jobs on boot."""
    print(" 📡 Scanning joined channels for recent jobs (Backfill)...")
    ingested_count = 0
    try:
        async for dialog in client.iter_dialogs(limit=50):
            if dialog.is_channel or dialog.is_group:
                try:
                    chat_title = dialog.title
                    chat_username = dialog.entity.username if hasattr(dialog.entity, 'username') else ""
                    messages = await client.get_messages(dialog.entity, limit=4)
                    for msg in messages:
                        if msg and msg.text:
                            process_message(msg, chat_title, chat_username)
                            ingested_count += 1
                except Exception:
                    continue
        print(f" [BACKFILL COMPLETE] Checked recent messages across active channels.")
    except Exception as e:
        print(f" Backfill notice: {e}")

async def periodic_buffer_flusher():
    """Periodically check in-memory stream status, and flush buffered jobs when toggled ON."""
    while True:
        try:
            await asyncio.sleep(8)
            if len(local_job_buffer) > 0:
                try:
                    res = requests.get(BACKEND_STATUS_URL, timeout=3)
                    if res.status_code == 200:
                        data = res.json().get('data', {})
                        if data.get('enabled') is True:
                            flushed = 0
                            print(f"\n [BURST FLUSH] Stream toggled ON in UI! Ingesting {len(local_job_buffer)} buffered jobs into Neon DB...")
                            while local_job_buffer:
                                job = local_job_buffer.popleft()
                                try:
                                    r = requests.post(BACKEND_INGEST_URL, json=job, timeout=5)
                                    if r.status_code in (200, 201):
                                        flushed += 1
                                except Exception:
                                    local_job_buffer.appendleft(job)
                                    break
                            print(f" [BURST COMPLETE] Successfully ingested {flushed} jobs into Neon DB.\n")
                except Exception:
                    pass
        except Exception:
            pass

async def main():
    print("=" * 65)
    print("  🛰️  ReCall AI — Real-Time Telegram Job Radar Listener")
    print("  Mode: 24/7 Autonomous Stream (Public & Private Channels)")
    print("=" * 65)

    # Connect seamlessly using existing StringSession without interactive prompts
    await client.connect()
    if not await client.is_user_authorized():
        print("[ERROR] Telegram session is not authorized. Please run login.py.")
        sys.exit(1)

    me = await client.get_me()
    print(f" Connected as: {me.first_name} (@{me.username or me.phone})")
    print(f" Target Backend: {BACKEND_INGEST_URL}")
    print("=" * 65)

    # Start background buffer flusher
    asyncio.create_task(periodic_buffer_flusher())

    # Run quick backfill so user has fresh jobs immediately
    await backfill_recent_jobs()

    print("\n 🚀 Live listener active! Listening to all your channels in real-time...")
    print(" Press Ctrl + C to stop.\n")
    await client.run_until_disconnected()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n Listener stopped safely.")

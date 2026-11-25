---
title: Spring @Transactional Propagation Modes
category: java
summary: How REQUIRED, REQUIRES_NEW, and NESTED behave across Spring AOP dynamic proxies.
code_language: java
read_time: 4 min
youtube_url: ""
---

## Explanation
In Spring Framework, transaction management is implemented via Spring AOP dynamic proxies. When a method annotated with `@Transactional` is invoked from outside the bean, the proxy intercepts the invocation and applies transaction boundary logic according to the configured `Propagation` behavior:

1. **REQUIRED (Default)**: Joins an existing physical transaction if one exists; otherwise starts a new one. A rollback in an inner method marks the entire outer transaction as `rollback-only`.
2. **REQUIRES_NEW**: Suspends the current transaction and starts an independent physical database transaction. If the inner transaction fails and is caught, the outer transaction can still commit.
3. **NESTED**: Executes within a nested transaction using database savepoints (if supported by JDBC driver). Rollback of the nested transaction only rolls back to the savepoint without aborting the outer transaction.

> **Crucial Pitfall**: Calling a `@Transactional` method from another method within the same bean bypasses the Spring AOP proxy (self-invocation), causing transaction annotations to be completely ignored.

## Code
```java
@Service
@RequiredArgsConstructor
public class PaymentProcessingService {

    private final AuditRepository auditRepository;
    private final PaymentGateway paymentGateway;

    @Transactional
    public void processPayment(PaymentRequest request) {
        // Outer transaction boundary
        logAuditTrail("INITIATED", request.getId());

        try {
            paymentGateway.charge(request.getAmount());
            logAuditTrail("SUCCESS", request.getId());
        } catch (Exception e) {
            logAuditTrail("FAILED", request.getId());
            throw new PaymentFailedException(e.getMessage());
        }
    }

    // REQUIRES_NEW: commits audit log even if outer payment transaction rolls back
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAuditTrail(String status, String orderId) {
        auditRepository.save(new AuditLog(orderId, status, Instant.now()));
    }
}
```

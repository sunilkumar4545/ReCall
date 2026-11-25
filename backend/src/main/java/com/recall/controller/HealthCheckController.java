package com.recall.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * HealthCheckController
 * 
 * Cloud Provider Zero-DB Health Check Endpoint:
 * Used by Render, Railway, Fly.io, and Docker health-checks.
 * Explicitly does NOT query the database to prevent cloud health probes
 * from keeping Neon PostgreSQL awake or consuming compute-hours.
 */
@RestController
public class HealthCheckController {

    @GetMapping({"/api/health", "/health", "/actuator/health"})
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "app", "ReCall AI",
                "timestamp", Instant.now().toString(),
                "storageMode", "Zero-Scale Serverless"
        ));
    }
}

package com.recall.controller;

import com.recall.dto.request.JobIngestRequest;
import com.recall.dto.response.ApiResponse;
import com.recall.dto.response.JobNotificationResponse;
import com.recall.dto.response.JobStatsResponse;
import com.recall.service.JobNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Tag(name = "Job Notifications Radar", description = "Automated real-time job ingestion from Telegram with zero-waste FIFO storage")
public class JobNotificationController {

    private final JobNotificationService jobNotificationService;

    // In-memory gatekeeper (Spring Boot RAM only - 0 Neon DB queries!).
    // Defaults to FALSE (ECO MODE) so Neon automatically suspends compute after 5 mins of inactivity.
    private final AtomicBoolean ingestionEnabled = new AtomicBoolean(false);

    @GetMapping("/stream-status")
    @Operation(summary = "Get in-memory stream status (0 database queries - RAM only)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStreamStatus() {
        boolean active = ingestionEnabled.get();
        return ResponseEntity.ok(ApiResponse.success(
                Map.of(
                        "enabled", active,
                        "mode", active ? "ACTIVE_STREAM" : "ECO_MODE",
                        "computeSavings", active ? "Active (Ingesting)" : "Neon Sleep (0.00 CU-hrs)"
                ),
                "Stream status retrieved from RAM"
        ));
    }

    @PostMapping("/stream-status")
    @Operation(summary = "Toggle in-memory stream status (0 database queries - RAM only)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setStreamStatus(@RequestParam boolean enabled) {
        ingestionEnabled.set(enabled);
        log.info("Job radar stream toggle switched to: {}", enabled ? "ACTIVE_STREAM" : "ECO_MODE (PAUSED TO SAVE COMPUTE)");
        return ResponseEntity.ok(ApiResponse.success(
                Map.of(
                        "enabled", enabled,
                        "mode", enabled ? "ACTIVE_STREAM" : "ECO_MODE",
                        "computeSavings", enabled ? "Active (Ingesting)" : "Neon Sleep (0.00 CU-hrs)"
                ),
                "Stream status updated in RAM"
        ));
    }

    @PostMapping("/ingest")
    @Operation(summary = "Ingest a new job notification from Telegram listener (auto-purges older jobs beyond 150)")
    public ResponseEntity<ApiResponse<JobNotificationResponse>> ingestJob(@Valid @RequestBody JobIngestRequest request) {
        // Fast-path RAM check: if Eco Mode is ON, return immediately BEFORE touching JPA/Hibernate or Neon DB!
        if (!ingestionEnabled.get()) {
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(ApiResponse.<JobNotificationResponse>builder()
                            .success(false)
                            .message("PAUSED_TO_SAVE_COMPUTE")
                            .build());
        }

        JobNotificationResponse response = jobNotificationService.ingestJob(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Job notification ingested successfully"));
    }

    @GetMapping
    @Operation(summary = "Get active job radar notifications with filtering")
    public ResponseEntity<ApiResponse<List<JobNotificationResponse>>> getRecentJobs(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) Integer limit) {
        List<JobNotificationResponse> jobs = jobNotificationService.getRecentJobs(query, filter, limit);
        return ResponseEntity.ok(ApiResponse.success(jobs, "Retrieved " + jobs.size() + " active jobs"));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get storage and buffer telemetry for job radar")
    public ResponseEntity<ApiResponse<JobStatsResponse>> getStats() {
        JobStatsResponse stats = jobNotificationService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Job radar telemetry retrieved"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Manually remove a job notification")
    public ResponseEntity<ApiResponse<Void>> deleteJob(@PathVariable Long id) {
        jobNotificationService.deleteJob(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Job notification removed"));
    }
}

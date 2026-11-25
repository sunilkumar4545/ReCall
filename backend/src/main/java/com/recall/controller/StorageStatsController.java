package com.recall.controller;

import com.recall.dto.response.ApiResponse;
import com.recall.dto.response.StorageStatsResponse;
import com.recall.service.StorageStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * StorageStatsController
 * 
 * Exposes live storage quota telemetry for Neon PostgreSQL and Backblaze B2.
 */
@Slf4j
@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
@Tag(name = "Storage Telemetry", description = "Live quota and capacity tracking for Neon DB and Backblaze B2")
public class StorageStatsController {

    private final StorageStatsService storageStatsService;

    @GetMapping("/stats")
    @Operation(summary = "Get live storage stats", description = "Calculates exact remaining storage in Neon (500MB) and Backblaze B2 (10GB)")
    public ResponseEntity<ApiResponse<StorageStatsResponse>> getStorageStats() {
        log.info("REST request to fetch live storage quota statistics");
        StorageStatsResponse stats = storageStatsService.getStorageStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Storage statistics retrieved successfully"));
    }
}

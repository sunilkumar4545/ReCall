package com.recall.service.impl;

import com.recall.dto.response.StorageStatsResponse;
import com.recall.service.StorageStatsService;
import com.recall.storage.config.StorageProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * StorageStatsServiceImpl
 * 
 * Computes live storage utilization for Neon PostgreSQL and Backblaze B2.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StorageStatsServiceImpl implements StorageStatsService {

    private final JdbcTemplate jdbcTemplate;
    private final StorageProperties storageProperties;

    // Quota limits
    private static final long NEON_LIMIT_BYTES = 500L * 1024L * 1024L;         // 500 MB
    private static final long BACKBLAZE_LIMIT_BYTES = 10L * 1024L * 1024L * 1024L; // 10 GB

    @Override
    @Transactional(readOnly = true)
    public StorageStatsResponse getStorageStats() {
        log.info("Calculating live storage quota metrics for Neon DB and Backblaze B2");

        // 1. Neon DB Size Query (sum of all tables + indexes + TOAST in public schema)
        long neonUsedBytes = 0L;
        try {
            Long tableBytes = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename))), 0) " +
                    "FROM pg_tables WHERE schemaname = 'public'", Long.class);
            if (tableBytes != null && tableBytes > 0) {
                neonUsedBytes = tableBytes;
            } else {
                Long dbSize = jdbcTemplate.queryForObject("SELECT pg_database_size(current_database())", Long.class);
                neonUsedBytes = (dbSize != null) ? dbSize : 0L;
            }
        } catch (Exception e) {
            log.warn("Database size query failed: {}", e.getMessage());
        }

        long totalEntries = 0L;
        long totalCategories = 0L;
        try {
            Long entriesCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM recall_entries", Long.class);
            totalEntries = (entriesCount != null) ? entriesCount : 0L;

            Long catCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM categories", Long.class);
            totalCategories = (catCount != null) ? catCount : 0L;
        } catch (Exception e) {
            log.warn("Counts query failed: {}", e.getMessage());
        }

        long neonFreeBytes = Math.max(0L, NEON_LIMIT_BYTES - neonUsedBytes);
        double neonUsagePercent = (double) neonUsedBytes / (double) NEON_LIMIT_BYTES * 100.0;
        neonUsagePercent = Math.round(neonUsagePercent * 1000.0) / 1000.0;

        StorageStatsResponse.NeonStats neonStats = StorageStatsResponse.NeonStats.builder()
                .usedBytes(neonUsedBytes)
                .limitBytes(NEON_LIMIT_BYTES)
                .usedFormatted(formatBytes(neonUsedBytes))
                .freeFormatted(formatBytes(neonFreeBytes))
                .limitFormatted(formatBytes(NEON_LIMIT_BYTES))
                .usagePercentage(neonUsagePercent)
                .totalEntries(totalEntries)
                .totalCategories(totalCategories)
                .build();

        // 2. Backblaze B2 Object Storage Metrics
        long rawBytes = 0L;
        long compressedBytes = 0L;
        long totalBlobs = 0L;

        try {
            Long rawSum = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(content_size_bytes), 0) FROM recall_entries WHERE content_key IS NOT NULL", Long.class);
            Long compSum = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(compressed_size_bytes), 0) FROM recall_entries WHERE content_key IS NOT NULL", Long.class);
            Long blobCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(content_key) FROM recall_entries WHERE content_key IS NOT NULL", Long.class);

            rawBytes = (rawSum != null) ? rawSum : 0L;
            compressedBytes = (compSum != null) ? compSum : 0L;
            totalBlobs = (blobCount != null) ? blobCount : 0L;
        } catch (Exception e) {
            log.warn("Failed to query Backblaze storage metrics from database: {}", e.getMessage());
        }

        long backblazeFreeBytes = Math.max(0L, BACKBLAZE_LIMIT_BYTES - compressedBytes);
        double backblazeUsagePercent = (double) compressedBytes / (double) BACKBLAZE_LIMIT_BYTES * 100.0;
        backblazeUsagePercent = Math.round(backblazeUsagePercent * 10000.0) / 10000.0;

        double savingsPercent = 0.0;
        if (rawBytes > 0 && compressedBytes > 0) {
            savingsPercent = 100.0 * (1.0 - ((double) compressedBytes / (double) rawBytes));
            savingsPercent = Math.round(savingsPercent * 10.0) / 10.0;
        }

        String bucket = storageProperties.getS3().getBucket();
        if (bucket == null || bucket.isBlank()) bucket = "recall4224";

        StorageStatsResponse.BackblazeStats backblazeStats = StorageStatsResponse.BackblazeStats.builder()
                .usedBytes(compressedBytes)
                .rawContentBytes(rawBytes)
                .limitBytes(BACKBLAZE_LIMIT_BYTES)
                .usedFormatted(formatBytes(compressedBytes))
                .rawFormatted(formatBytes(rawBytes))
                .freeFormatted(formatBytes(backblazeFreeBytes))
                .limitFormatted(formatBytes(BACKBLAZE_LIMIT_BYTES))
                .usagePercentage(backblazeUsagePercent)
                .savingsPercentage(savingsPercent)
                .totalBlobs(totalBlobs)
                .bucketName(bucket)
                .storageType(storageProperties.getType().toUpperCase())
                .build();

        return StorageStatsResponse.builder()
                .neon(neonStats)
                .backblaze(backblazeStats)
                .build();
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        }
        double kb = (double) bytes / 1024.0;
        if (kb < 1024) {
            return String.format("%.2f KB", kb);
        }
        double mb = kb / 1024.0;
        if (mb < 1024) {
            return String.format("%.2f MB", mb);
        }
        double gb = mb / 1024.0;
        return String.format("%.2f GB", gb);
    }
}

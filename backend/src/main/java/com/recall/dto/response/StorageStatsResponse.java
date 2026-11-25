package com.recall.dto.response;

import lombok.*;

/**
 * StorageStatsResponse
 * 
 * Provides live telemetry and quota monitoring for:
 * 1. Neon Serverless PostgreSQL (500 MB free tier limit)
 * 2. Backblaze B2 Object Storage (10 GB free tier limit)
 * 3. Overall Claim-Check GZIP compression efficiency
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageStatsResponse {

    private NeonStats neon;
    private BackblazeStats backblaze;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NeonStats {
        private long usedBytes;
        private long limitBytes;
        private String usedFormatted;
        private String freeFormatted;
        private String limitFormatted;
        private double usagePercentage;
        private long totalEntries;
        private long totalCategories;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BackblazeStats {
        private long usedBytes;
        private long rawContentBytes;
        private long limitBytes;
        private String usedFormatted;
        private String rawFormatted;
        private String freeFormatted;
        private String limitFormatted;
        private double usagePercentage;
        private double savingsPercentage;
        private long totalBlobs;
        private String bucketName;
        private String storageType;
    }
}

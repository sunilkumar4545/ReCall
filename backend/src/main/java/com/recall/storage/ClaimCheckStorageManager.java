package com.recall.storage;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.recall.common.util.GzipCompressionUtil;
import com.recall.storage.config.StorageProperties;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * ClaimCheckStorageManager
 * 
 * Orchestrates the Claim-Check Pattern:
 * 1. Bundles large text & code content into a JSON payload.
 * 2. Compresses the payload via Java's GZIPOutputStream (70-85% size shrink).
 * 3. Uploads the .json.gz file to S3 Object Storage (Backblaze B2 / Tigris) or Local storage.
 * 4. Yields a lightweight reference (key + stats) to be stored in Neon PostgreSQL.
 * 5. On read, fetches and decompresses on-the-fly with GZIPInputStream.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClaimCheckStorageManager {

    private final StorageProperties properties;
    private final LocalStorageService localStorageService;
    private final S3CompatibleStorageService s3Service;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemoryBlobPayload {
        private String explanation;
        private String codeSnippet;
    }

    @Getter
    @AllArgsConstructor
    public static class ClaimCheckResult {
        private final String contentKey;
        private final long rawSizeBytes;
        private final long compressedSizeBytes;
        private final double savingsPercent;
    }

    /**
     * Determines active storage provider based on configuration.
     */
    private ObjectStorageService getActiveStorage() {
        String type = properties.getType();
        if ("s3".equalsIgnoreCase(type) || ("auto".equalsIgnoreCase(type) && s3Service.isReady())) {
            return s3Service;
        }
        return localStorageService;
    }

    /**
     * Stores explanation and code snippet as a compressed Claim-Check blob.
     * 
     * @param categorySlug Category slug
     * @param entryId Entry ID (or temporary identifier)
     * @param explanation Long explanation markdown/text
     * @param codeSnippet Code snippet
     * @return ClaimCheckResult with key, raw bytes, compressed bytes, and savings %
     */
    public ClaimCheckResult storeContent(String categorySlug, Long entryId, String explanation, String codeSnippet) {
        try {
            MemoryBlobPayload payload = MemoryBlobPayload.builder()
                    .explanation(explanation != null ? explanation : "")
                    .codeSnippet(codeSnippet != null ? codeSnippet : "")
                    .build();

            // 1. Serialize to JSON
            String json = objectMapper.writeValueAsString(payload);
            byte[] rawBytes = json.getBytes(StandardCharsets.UTF_8);
            long rawSize = rawBytes.length;

            // 2. Compress via GZIP
            byte[] compressedBytes = GzipCompressionUtil.compressBytes(rawBytes);
            long compressedSize = compressedBytes.length;
            double savings = GzipCompressionUtil.calculateSavingsPercentage(rawSize, compressedSize);

            // 3. Build unique storage key
            String safeCategory = (categorySlug != null && !categorySlug.isBlank()) ? categorySlug.trim().toLowerCase() : "general";
            String key = String.format("entries/%s/%d.json.gz", safeCategory, entryId != null ? entryId : System.currentTimeMillis());

            // 4. Upload to Object Storage
            ObjectStorageService activeStorage = getActiveStorage();
            activeStorage.upload(key, compressedBytes, "application/gzip");

            log.info("Claim-Check Stored [{}]: key='{}' | raw: {} bytes -> compressed: {} bytes ({.1f}% saved)",
                    activeStorage.getStorageType(), key, rawSize, compressedSize, savings);

            return new ClaimCheckResult(key, rawSize, compressedSize, savings);
        } catch (Exception e) {
            log.error("Failed to store Claim-Check blob: {}", e.getMessage(), e);
            throw new RuntimeException("Claim-Check storage failure: " + e.getMessage(), e);
        }
    }

    /**
     * Stores content using a specific, predetermined storage key (e.g. for safe versioned updates).
     */
    public ClaimCheckResult storeContentWithKey(String customKey, String explanation, String codeSnippet) {
        try {
            MemoryBlobPayload payload = MemoryBlobPayload.builder()
                    .explanation(explanation != null ? explanation : "")
                    .codeSnippet(codeSnippet != null ? codeSnippet : "")
                    .build();

            String json = objectMapper.writeValueAsString(payload);
            byte[] rawBytes = json.getBytes(StandardCharsets.UTF_8);
            long rawSize = rawBytes.length;

            byte[] compressedBytes = GzipCompressionUtil.compressBytes(rawBytes);
            long compressedSize = compressedBytes.length;
            double savings = GzipCompressionUtil.calculateSavingsPercentage(rawSize, compressedSize);

            ObjectStorageService activeStorage = getActiveStorage();
            activeStorage.upload(customKey, compressedBytes, "application/gzip");

            log.info("Claim-Check Stored Versioned [{}]: key='{}' | raw: {} -> compressed: {} ({.1f}% saved)",
                    activeStorage.getStorageType(), customKey, rawSize, compressedSize, savings);

            return new ClaimCheckResult(customKey, rawSize, compressedSize, savings);
        } catch (Exception e) {
            log.error("Failed to store versioned Claim-Check blob '{}': {}", customKey, e.getMessage(), e);
            throw new RuntimeException("Claim-Check storage failure: " + e.getMessage(), e);
        }
    }

    /**
     * Retrieves and decompresses content by storage key.
     */
    public MemoryBlobPayload fetchContent(String contentKey) {
        if (contentKey == null || contentKey.isBlank()) {
            return new MemoryBlobPayload("", "");
        }

        try {
            // Check active storage first
            ObjectStorageService activeStorage = getActiveStorage();
            byte[] compressedBytes;

            if (activeStorage.exists(contentKey)) {
                compressedBytes = activeStorage.download(contentKey);
            } else if (localStorageService.exists(contentKey)) {
                // Fallback to local
                compressedBytes = localStorageService.download(contentKey);
            } else if (s3Service.isReady() && s3Service.exists(contentKey)) {
                // Fallback to S3
                compressedBytes = s3Service.download(contentKey);
            } else {
                log.warn("Claim-Check blob not found in any storage for key: '{}'", contentKey);
                return new MemoryBlobPayload("", "");
            }

            if (compressedBytes.length == 0) {
                return new MemoryBlobPayload("", "");
            }

            // Decompress GZIP bytes
            byte[] decompressedBytes = GzipCompressionUtil.decompressBytes(compressedBytes);
            String json = new String(decompressedBytes, StandardCharsets.UTF_8);

            return objectMapper.readValue(json, MemoryBlobPayload.class);
        } catch (Exception e) {
            log.error("Failed to fetch or decompress Claim-Check blob for key='{}': {}", contentKey, e.getMessage(), e);
            return new MemoryBlobPayload("", "");
        }
    }

    /**
     * Deletes a Claim-Check blob from object storage.
     */
    public void deleteContent(String contentKey) {
        if (contentKey == null || contentKey.isBlank()) return;

        try {
            getActiveStorage().delete(contentKey);
            if (localStorageService.exists(contentKey)) {
                localStorageService.delete(contentKey);
            }
        } catch (Exception e) {
            log.warn("Failed to delete Claim-Check blob '{}': {}", contentKey, e.getMessage());
        }
    }
}

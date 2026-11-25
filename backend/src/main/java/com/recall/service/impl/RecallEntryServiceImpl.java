package com.recall.service.impl;

import com.recall.common.exception.ResourceNotFoundException;
import com.recall.dto.request.CreateEntryRequest;
import com.recall.dto.request.UpdateEntryRequest;
import com.recall.dto.response.RecallEntryResponse;
import com.recall.entity.CategoryEntity;
import com.recall.entity.RecallEntryEntity;
import com.recall.repository.CategoryRepository;
import com.recall.repository.RecallEntryRepository;
import com.recall.service.RecallEntryService;
import com.recall.storage.ClaimCheckStorageManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * RecallEntryServiceImpl
 * 
 * Implements business logic for developer memory logs and topic lessons.
 * Employs clean, non-spammy request-level logging.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecallEntryServiceImpl implements RecallEntryService {

    private final RecallEntryRepository entryRepository;
    private final CategoryRepository categoryRepository;
    private final ClaimCheckStorageManager claimCheckManager;

    private static final Pattern YOUTUBE_PATTERN = Pattern.compile(
            "^(?:https?:\\/\\/)?(?:www\\.)?(?:youtube\\.com\\/(?:watch\\?v=|shorts\\/)|youtu\\.be\\/)([a-zA-Z0-9_-]{11})(?:[&?].*)?$"
    );

    @Override
    @Transactional(readOnly = true)
    public List<RecallEntryResponse> getAllEntries() {
        log.info("Fetching all memory log entries");
        return entryRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecallEntryResponse> getEntriesByCategorySlug(String categorySlug) {
        log.info("Fetching memory log entries for category: '{}'", categorySlug);
        List<RecallEntryEntity> list = entryRepository.findByCategory_SlugOrderByCreatedAtDesc(categorySlug);
        if (list.isEmpty()) {
            try {
                Long id = Long.parseLong(categorySlug);
                CategoryEntity cat = categoryRepository.findById(id).orElse(null);
                if (cat != null) {
                    list = entryRepository.findByCategory_SlugOrderByCreatedAtDesc(cat.getSlug());
                }
            } catch (NumberFormatException ignored) {
            }
        }
        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RecallEntryResponse getEntryById(Long id) {
        log.info("Fetching memory log entry ID={}", id);
        RecallEntryEntity entity = entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found with id: " + id));
        return mapToResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecallEntryResponse> searchEntries(String query) {
        log.info("Searching memory log entries with query: '{}'", query);
        if (query == null || query.isBlank()) {
            return getAllEntries();
        }
        return entryRepository.searchEntries(query.trim())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RecallEntryResponse createEntry(CreateEntryRequest request) {
        log.info("Creating memory log entry: title='{}', category='{}'", request.getTitle(), request.getCategorySlug());

        CategoryEntity category = categoryRepository.findBySlug(request.getCategorySlug())
                .orElseGet(() -> {
                    try {
                        Long id = Long.parseLong(request.getCategorySlug());
                        return categoryRepository.findById(id).orElse(null);
                    } catch (NumberFormatException ignored) {
                        return null;
                    }
                });

        if (category == null) {
            String rawSlug = request.getCategorySlug() != null ? request.getCategorySlug().trim().toLowerCase() : "general";
            String cleanSlug = rawSlug.replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
            if (cleanSlug.isBlank()) cleanSlug = "general";
            final String finalSlug = cleanSlug;
            category = categoryRepository.findBySlug(finalSlug).orElseGet(() -> {
                String displayName = Character.toUpperCase(finalSlug.charAt(0)) + finalSlug.substring(1).replace('-', ' ');
                return categoryRepository.save(CategoryEntity.builder()
                        .name(displayName)
                        .slug(finalSlug)
                        .build());
            });
        }

        String embedUrl = convertToYouTubeEmbed(request.getYoutubeUrl());

        // Neon DB stores ONLY metadata (no large raw explanation or code blobs)
        RecallEntryEntity entity = RecallEntryEntity.builder()
                .category(category)
                .title(request.getTitle().trim())
                .summary(request.getSummary() != null ? request.getSummary().trim() : null)
                .codeLanguage(request.getCodeLanguage() != null ? request.getCodeLanguage().trim() : "java")
                .imageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : null)
                .youtubeUrl(request.getYoutubeUrl() != null ? request.getYoutubeUrl().trim() : null)
                .youtubeEmbedUrl(embedUrl)
                .pdfUrl(request.getPdfUrl() != null ? request.getPdfUrl().trim() : null)
                .pdfName(request.getPdfName() != null ? request.getPdfName().trim() : null)
                .build();

        RecallEntryEntity saved = entryRepository.save(entity);

        // Claim-Check Pattern: Compress text & code via GZIP and upload to Object Storage
        String rawExplanation = request.getExplanation() != null ? request.getExplanation().trim() : "";
        String rawCodeSnippet = request.getCodeSnippet() != null ? request.getCodeSnippet().trim() : "";

        // Two-Phase Cleanup: Roll back B2 blob if Neon DB update fails
        String uploadedKey = null;
        try {
            ClaimCheckStorageManager.ClaimCheckResult claimResult = claimCheckManager.storeContent(
                    category.getSlug(), saved.getId(), rawExplanation, rawCodeSnippet
            );
            uploadedKey = claimResult.getContentKey();

            saved.setContentKey(claimResult.getContentKey());
            saved.setContentSizeBytes(claimResult.getRawSizeBytes());
            saved.setCompressedSizeBytes(claimResult.getCompressedSizeBytes());
            saved.setCompressionType("GZIP");
            saved = entryRepository.save(saved);
        } catch (Exception e) {
            if (uploadedKey != null) {
                log.warn("Two-Phase Cleanup: Rolling back orphaned Claim-Check blob after database write failure: {}", uploadedKey);
                try {
                    claimCheckManager.deleteContent(uploadedKey);
                } catch (Exception deleteEx) {
                    log.error("Failed to clean up orphaned blob during rollback: {}", deleteEx.getMessage());
                }
            }
            throw e;
        }

        RecallEntryResponse response = mapToResponse(saved);
        // Explicitly attach the fresh content to immediate response
        response.setExplanation(rawExplanation);
        response.setCodeSnippet(rawCodeSnippet);
        return response;
    }

    @Override
    @Transactional
    public RecallEntryResponse updateEntry(Long id, UpdateEntryRequest request) {
        log.info("Updating memory log entry ID={}", id);

        RecallEntryEntity entity = entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entry not found with id: " + id));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            entity.setTitle(request.getTitle().trim());
        }
        if (request.getSummary() != null) {
            entity.setSummary(request.getSummary().trim());
        }
        if (request.getCodeLanguage() != null) {
            entity.setCodeLanguage(request.getCodeLanguage().trim());
        }
        if (request.getImageUrl() != null) {
            entity.setImageUrl(request.getImageUrl().trim());
        }
        if (request.getYoutubeUrl() != null) {
            entity.setYoutubeUrl(request.getYoutubeUrl().trim());
            entity.setYoutubeEmbedUrl(convertToYouTubeEmbed(request.getYoutubeUrl().trim()));
        }
        if (request.getPdfUrl() != null) {
            entity.setPdfUrl(request.getPdfUrl().trim());
        }
        if (request.getPdfName() != null) {
            entity.setPdfName(request.getPdfName().trim());
        }

        // Claim-Check: Re-compress and upload updated explanation and code
        boolean contentChanged = false;
        String newExplanation = entity.getExplanation();
        String newCodeSnippet = entity.getCodeSnippet();

        if (entity.getContentKey() != null) {
            ClaimCheckStorageManager.MemoryBlobPayload existingPayload = claimCheckManager.fetchContent(entity.getContentKey());
            newExplanation = existingPayload.getExplanation();
            newCodeSnippet = existingPayload.getCodeSnippet();
        }

        if (request.getExplanation() != null) {
            newExplanation = request.getExplanation().trim();
            contentChanged = true;
        }
        if (request.getCodeSnippet() != null) {
            newCodeSnippet = request.getCodeSnippet().trim();
            contentChanged = true;
        }

        if (contentChanged || entity.getContentKey() == null) {
            String oldKey = entity.getContentKey();
            long timestamp = System.currentTimeMillis();
            String safeCategory = entity.getCategory().getSlug().trim().toLowerCase();
            String versionedKey = String.format("entries/%s/%d-v%d.json.gz", safeCategory, entity.getId(), timestamp);

            String uploadedNewKey = null;
            try {
                ClaimCheckStorageManager.ClaimCheckResult claimResult = claimCheckManager.storeContentWithKey(
                        versionedKey, newExplanation, newCodeSnippet
                );
                uploadedNewKey = claimResult.getContentKey();

                entity.setContentKey(claimResult.getContentKey());
                entity.setContentSizeBytes(claimResult.getRawSizeBytes());
                entity.setCompressedSizeBytes(claimResult.getCompressedSizeBytes());
                entity.setCompressionType("GZIP");
                // Clear uncompressed text from Neon PostgreSQL row
                entity.setExplanation(null);
                entity.setCodeSnippet(null);

                // 1. Commit update to Neon DB first
                RecallEntryEntity updated = entryRepository.save(entity);

                // 2. Delete old key ONLY AFTER Neon update succeeds!
                if (oldKey != null && !oldKey.equals(uploadedNewKey)) {
                    claimCheckManager.deleteContent(oldKey);
                }

                RecallEntryResponse response = mapToResponse(updated);
                response.setExplanation(newExplanation);
                response.setCodeSnippet(newCodeSnippet);
                return response;
            } catch (Exception e) {
                if (uploadedNewKey != null) {
                    log.warn("Rolling back new versioned blob after failed database update: {}", uploadedNewKey);
                    try {
                        claimCheckManager.deleteContent(uploadedNewKey);
                    } catch (Exception deleteEx) {
                        log.error("Failed to delete new blob during update rollback: {}", deleteEx.getMessage());
                    }
                }
                throw e;
            }
        }

        RecallEntryEntity updated = entryRepository.save(entity);
        RecallEntryResponse response = mapToResponse(updated);
        response.setExplanation(newExplanation);
        response.setCodeSnippet(newCodeSnippet);
        return response;
    }

    @Override
    @Transactional
    public void deleteEntry(Long id) {
        log.info("Deleting memory log entry ID={}", id);
        RecallEntryEntity entity = entryRepository.findById(id).orElse(null);
        if (entity == null) {
            log.warn("Memory log entry ID={} already deleted or does not exist. No-op.", id);
            return;
        }

        // Claim-Check: Delete compressed object from Backblaze B2 / Object Storage
        if (entity.getContentKey() != null) {
            claimCheckManager.deleteContent(entity.getContentKey());
        }

        // Detach from parent category collection to prevent cascade issues
        CategoryEntity category = entity.getCategory();
        if (category != null && category.getEntries() != null) {
            category.getEntries().remove(entity);
        }

        entryRepository.delete(entity);
        log.info("Successfully deleted memory log entry ID={}", id);
    }

    private String convertToYouTubeEmbed(String url) {
        if (url == null || url.isBlank()) return null;
        Matcher matcher = YOUTUBE_PATTERN.matcher(url.trim());
        if (matcher.find()) {
            return "https://www.youtube.com/embed/" + matcher.group(1);
        }
        return null;
    }

    private String calculateReadTime(String text) {
        if (text == null || text.isBlank()) return "1 min read";
        int wordCount = text.trim().split("\\s+").length;
        int minutes = Math.max(1, (int) Math.ceil(wordCount / 180.0));
        return minutes + " min read";
    }

    private RecallEntryResponse mapToResponse(RecallEntryEntity entity) {
        String explanation = entity.getExplanation();
        String codeSnippet = entity.getCodeSnippet();

        // Claim-Check: If stored in Object Storage, decompress and fetch on the fly
        if (entity.getContentKey() != null && !entity.getContentKey().isBlank()) {
            ClaimCheckStorageManager.MemoryBlobPayload payload = claimCheckManager.fetchContent(entity.getContentKey());
            if (payload != null) {
                explanation = payload.getExplanation();
                codeSnippet = payload.getCodeSnippet();
            }
        }

        String fullContent = (entity.getSummary() != null ? entity.getSummary() : "") + " " +
                             (explanation != null ? explanation : "");
        String readTime = calculateReadTime(fullContent);

        Double savings = null;
        if (entity.getContentSizeBytes() != null && entity.getCompressedSizeBytes() != null && entity.getContentSizeBytes() > 0) {
            double rawSavings = 100.0 * (1.0 - ((double) entity.getCompressedSizeBytes() / (double) entity.getContentSizeBytes()));
            savings = Math.round(rawSavings * 10.0) / 10.0;
        }

        return RecallEntryResponse.builder()
                .id(entity.getId())
                .categorySlug(entity.getCategory().getSlug())
                .categoryName(entity.getCategory().getName())
                .title(entity.getTitle())
                .summary(entity.getSummary())
                .explanation(explanation)
                .codeLanguage(entity.getCodeLanguage())
                .codeSnippet(codeSnippet)
                .imageUrl(entity.getImageUrl())
                .youtubeUrl(entity.getYoutubeUrl())
                .youtubeEmbedUrl(entity.getYoutubeEmbedUrl())
                .pdfUrl(entity.getPdfUrl())
                .pdfName(entity.getPdfName())
                .readTime(readTime)
                .contentKey(entity.getContentKey())
                .contentSizeBytes(entity.getContentSizeBytes())
                .compressedSizeBytes(entity.getCompressedSizeBytes())
                .savingsPercentage(savings)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

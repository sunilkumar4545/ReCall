package com.recall.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.recall.entity.CategoryEntity;
import com.recall.entity.RecallEntryEntity;
import com.recall.repository.CategoryRepository;
import com.recall.repository.RecallEntryRepository;
import com.recall.storage.ClaimCheckStorageManager;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * BackupController
 * 
 * Provides automated, self-contained backup and data sovereignty exports:
 * - Dumps all normalized metadata from Neon PostgreSQL into a metadata.json file.
 * - Decompresses all Claim-Check GZIP blobs from Backblaze B2 into individual .md Markdown files.
 * - Packages everything into a single downloadable .zip archive.
 */
@Slf4j
@RestController
@RequestMapping("/api/backup")
@RequiredArgsConstructor
@Tag(name = "Backup & Export", description = "Export knowledge base and decompressed notes as a portable ZIP archive")
public class BackupController {

    private final CategoryRepository categoryRepository;
    private final RecallEntryRepository entryRepository;
    private final ClaimCheckStorageManager claimCheckManager;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .enable(SerializationFeature.INDENT_OUTPUT);

    @GetMapping("/export")
    @Operation(summary = "Export knowledge base as ZIP", 
               description = "Generates a full backup archive containing metadata.json and all decompressed markdown notes")
    public void exportBackupZip(HttpServletResponse response) throws IOException {
        String timestamp = DateTimeFormatter.ISO_INSTANT.format(Instant.now()).replaceAll("[:.]", "-");
        String filename = "recall-backup-" + timestamp + ".zip";

        response.setContentType("application/zip");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

        log.info("Starting knowledge base ZIP backup export: {}", filename);

        try (ZipOutputStream zos = new ZipOutputStream(response.getOutputStream())) {
            List<CategoryEntity> categories = categoryRepository.findAll();
            List<RecallEntryEntity> entries = entryRepository.findAllByOrderByCreatedAtDesc();

            // 1. Build and write metadata.json
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("system", "ReCall by sunil4224");
            metadata.put("exportedAt", Instant.now().toString());
            metadata.put("totalCategories", categories.size());
            metadata.put("totalEntries", entries.size());

            List<Map<String, Object>> categorySummaries = new ArrayList<>();
            for (CategoryEntity cat : categories) {
                Map<String, Object> cMap = new LinkedHashMap<>();
                cMap.put("id", cat.getId());
                cMap.put("name", cat.getName());
                cMap.put("slug", cat.getSlug());
                categorySummaries.add(cMap);
            }
            metadata.put("categories", categorySummaries);

            List<Map<String, Object>> entrySummaries = new ArrayList<>();
            for (RecallEntryEntity e : entries) {
                Map<String, Object> eMap = new LinkedHashMap<>();
                eMap.put("id", e.getId());
                eMap.put("category", e.getCategory().getSlug());
                eMap.put("title", e.getTitle());
                eMap.put("summary", e.getSummary());
                eMap.put("codeLanguage", e.getCodeLanguage());
                eMap.put("contentKey", e.getContentKey());
                eMap.put("contentSizeBytes", e.getContentSizeBytes());
                eMap.put("compressedSizeBytes", e.getCompressedSizeBytes());
                eMap.put("createdAt", e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
                entrySummaries.add(eMap);
            }
            metadata.put("entries", entrySummaries);

            byte[] metadataBytes = objectMapper.writeValueAsBytes(metadata);
            zos.putNextEntry(new ZipEntry("recall-metadata.json"));
            zos.write(metadataBytes);
            zos.closeEntry();

            // 2. Write individual markdown notes for each entry
            for (RecallEntryEntity e : entries) {
                String explanation = e.getExplanation();
                String codeSnippet = e.getCodeSnippet();

                // Fetch decompressed content from Claim-Check storage if offloaded
                if (e.getContentKey() != null && !e.getContentKey().isBlank()) {
                    try {
                        ClaimCheckStorageManager.MemoryBlobPayload payload = claimCheckManager.fetchContent(e.getContentKey());
                        if (payload != null) {
                            if (payload.getExplanation() != null) explanation = payload.getExplanation();
                            if (payload.getCodeSnippet() != null) codeSnippet = payload.getCodeSnippet();
                        }
                    } catch (Exception ex) {
                        log.warn("Failed to fetch blob for entry ID {}: {}", e.getId(), ex.getMessage());
                    }
                }

                // Format markdown content
                StringBuilder md = new StringBuilder();
                md.append("# ").append(e.getTitle()).append("\n\n");
                md.append("> **Category:** `").append(e.getCategory().getName())
                  .append(" (").append(e.getCategory().getSlug()).append(")` | ")
                  .append("**Created:** ").append(e.getCreatedAt() != null ? e.getCreatedAt().toString() : "N/A")
                  .append("\n\n");

                if (e.getSummary() != null && !e.getSummary().isBlank()) {
                    md.append("## Summary\n\n").append(e.getSummary()).append("\n\n");
                }

                if (explanation != null && !explanation.isBlank()) {
                    md.append("## Notes & Explanation\n\n").append(explanation).append("\n\n");
                }

                if (codeSnippet != null && !codeSnippet.isBlank()) {
                    String lang = e.getCodeLanguage() != null && !e.getCodeLanguage().isBlank() ? e.getCodeLanguage() : "text";
                    md.append("## Code Snippet (").append(lang).append(")\n\n");
                    md.append("```").append(lang).append("\n");
                    md.append(codeSnippet).append("\n");
                    md.append("```\n\n");
                }

                if (e.getYoutubeUrl() != null && !e.getYoutubeUrl().isBlank()) {
                    md.append("**YouTube Walkthrough:** ").append(e.getYoutubeUrl()).append("\n");
                }
                if (e.getPdfUrl() != null && !e.getPdfUrl().isBlank()) {
                    md.append("**Reference Document:** [").append(e.getPdfName() != null ? e.getPdfName() : "PDF Document")
                      .append("](").append(e.getPdfUrl()).append(")\n");
                }

                String safeCategory = e.getCategory().getSlug().toLowerCase().replaceAll("[^a-z0-9_-]", "-");
                String safeTitle = e.getTitle().toLowerCase().replaceAll("[^a-z0-9_-]", "-").replaceAll("^-+|-+$", "");
                if (safeTitle.isBlank()) safeTitle = "entry";
                String entryPath = String.format("notes/%s/%s-%d.md", safeCategory, safeTitle, e.getId());

                byte[] mdBytes = md.toString().getBytes(StandardCharsets.UTF_8);
                zos.putNextEntry(new ZipEntry(entryPath));
                zos.write(mdBytes);
                zos.closeEntry();
            }

            zos.finish();
            log.info("Successfully exported ZIP backup archive: {} ({} notes processed)", filename, entries.size());
        }
    }
}

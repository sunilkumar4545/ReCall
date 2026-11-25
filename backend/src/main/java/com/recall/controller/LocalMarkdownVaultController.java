package com.recall.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.recall.service.GitHubVaultSyncService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * LocalMarkdownVaultController
 * 
 * ZERO-DATABASE / ZERO-OBJECT-STORAGE Local Markdown Notes Controller:
 * Manages `.md` files directly on the local filesystem in `frontend/src/content/notes/`.
 * Does not touch Neon PostgreSQL or Backblaze B2, preserving 0.00 CU-hours.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/local-notes")
@Tag(name = "Git-Backed Markdown Vault", description = "Zero-DB / Zero-B2 Local Markdown File Operations")
public class LocalMarkdownVaultController {

    private final GitHubVaultSyncService gitHubSyncService;

    private static final Pattern FRONTMATTER_PATTERN = Pattern.compile("^---\\r?\\n([\\s\\S]*?)\\r?\\n---", Pattern.MULTILINE);
    private static final Pattern EXPLANATION_PATTERN = Pattern.compile("##\\s*Explanation\\r?\\n([\\s\\S]*?)(?=(##\\s*Code|$))", Pattern.CASE_INSENSITIVE);
    private static final Pattern CODE_BLOCK_PATTERN = Pattern.compile("```([a-zA-Z0-9_-]*)\\r?\\n([\\s\\S]*?)```");

    @Data
    @Builder
    public static class LocalNoteDto {
        private String id;
        private String relativePath;
        private String filename;
        private String category;
        private String title;
        private String summary;
        private String explanation;
        private String codeSnippet;
        private String codeLanguage;
        private String readTime;
        private String youtubeUrl;
        private long sizeBytes;
        private String lastModified;
        private String rawContent;
    }

    @Data
    public static class CreateMarkdownNoteRequest {
        private String category;
        private String title;
        private String summary;
        private String explanation;
        private String codeSnippet;
        private String codeLanguage;
        private String readTime;
        private String youtubeUrl;
    }

    /**
     * Resolve the absolute path to `frontend/src/content/notes`.
     */
    private Path getNotesDirectory() {
        Path userDir = Paths.get("").toAbsolutePath();
        // 1. If running from backend/
        Path candidate1 = userDir.resolve("../frontend/src/content/notes").normalize();
        if (Files.exists(candidate1)) {
            return candidate1;
        }
        // 2. If running from project root Recall/
        Path candidate2 = userDir.resolve("frontend/src/content/notes").normalize();
        if (Files.exists(candidate2)) {
            return candidate2;
        }
        // 3. Fallback: try candidate1 and create directories
        try {
            Files.createDirectories(candidate1);
            return candidate1;
        } catch (IOException e) {
            log.warn("Could not create notes directory: {}", e.getMessage());
            return candidate2;
        }
    }

    @GetMapping
    @Operation(summary = "List all local markdown notes from frontend/src/content/notes")
    public ResponseEntity<Map<String, Object>> listNotes() {
        Path notesDir = getNotesDirectory();
        if (!Files.exists(notesDir)) {
            return ResponseEntity.ok(Map.of("notes", Collections.emptyList(), "total", 0, "rootPath", notesDir.toString()));
        }

        List<LocalNoteDto> notes = new ArrayList<>();
        try (Stream<Path> stream = Files.walk(notesDir)) {
            List<Path> mdFiles = stream
                    .filter(Files::isRegularFile)
                    .filter(p -> p.toString().toLowerCase().endsWith(".md"))
                    .toList();

            for (Path path : mdFiles) {
                try {
                    String raw = Files.readString(path, StandardCharsets.UTF_8);
                    Path relPath = notesDir.relativize(path);
                    String relStr = relPath.toString().replace('\\', '/');
                    String category = relPath.getNameCount() > 1 ? relPath.getName(0).toString() : "general";

                    LocalNoteDto parsed = parseMarkdownFile(raw, relStr, path.getFileName().toString(), category);
                    parsed.setSizeBytes(Files.size(path));
                    parsed.setLastModified(Files.getLastModifiedTime(path).toInstant().toString());
                    notes.add(parsed);
                } catch (Exception e) {
                    log.warn("Failed to parse local markdown file {}: {}", path, e.getMessage());
                }
            }
        } catch (IOException e) {
            log.error("Failed to walk notes directory {}: {}", notesDir, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to scan notes: " + e.getMessage()));
        }

        // If local disk has no notes (e.g. running in serverless cloud) and GitHub sync is active, load from GitHub
        if (notes.isEmpty() && gitHubSyncService.isEnabled()) {
            List<Map<String, String>> remote = gitHubSyncService.fetchRemoteNotes();
            for (Map<String, String> item : remote) {
                String relPath = item.get("relativePath");
                String raw = item.get("rawContent");
                String[] parts = relPath.split("/");
                String filename = parts[parts.length - 1];
                String cat = parts.length > 1 ? parts[0] : "general";
                LocalNoteDto parsed = parseMarkdownFile(raw, relPath, filename, cat);
                parsed.setSizeBytes(raw.getBytes(StandardCharsets.UTF_8).length);
                parsed.setLastModified(Instant.now().toString());
                notes.add(parsed);
            }
        }

        // Sort descending by last modified
        notes.sort((a, b) -> Objects.toString(b.getLastModified(), "").compareTo(Objects.toString(a.getLastModified(), "")));

        return ResponseEntity.ok(Map.of(
                "notes", notes,
                "total", notes.size(),
                "storageMode", "ZERO_DB_GIT_BACKED",
                "gitHubSyncEnabled", gitHubSyncService.isEnabled(),
                "gitHubRepo", gitHubSyncService.getRepo(),
                "gitHubBranch", gitHubSyncService.getBranch(),
                "rootPath", notesDir.toString()
        ));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Create or save a new .md note file directly to frontend/src/content/notes/<category>/<slug>.md")
    public ResponseEntity<?> createNote(@RequestBody CreateMarkdownNoteRequest req) {
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));
        }

        String category = (req.getCategory() != null && !req.getCategory().isBlank()) 
                ? slugify(req.getCategory()) 
                : "general";
        String fileSlug = slugify(req.getTitle()) + ".md";

        Path notesDir = getNotesDirectory();
        Path categoryDir = notesDir.resolve(category).normalize();

        try {
            Files.createDirectories(categoryDir);
            Path targetFile = categoryDir.resolve(fileSlug).normalize();

            String markdown = buildMarkdownContent(req, category);
            Files.writeString(targetFile, markdown, StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            String relativePath = category + "/" + fileSlug;
            log.info("Saved local markdown note to disk: {}", targetFile);

            LocalNoteDto noteDto = parseMarkdownFile(markdown, relativePath, fileSlug, category);
            noteDto.setSizeBytes(Files.size(targetFile));
            noteDto.setLastModified(Instant.now().toString());

            // 2. Auto-commit to GitHub repository (persists across cloud deploys with 0 database)
            boolean gitHubCommitted = gitHubSyncService.commitFile(
                    relativePath, markdown, "docs(vault): add " + req.getTitle().trim()
            );
            if (gitHubCommitted) {
                log.info("Auto-committed note to GitHub repo {}: {}", gitHubSyncService.getRepo(), relativePath);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(noteDto);
        } catch (IOException e) {
            log.error("Failed to write markdown note file: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to save file: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload an existing .md file directly into frontend/src/content/notes")
    public ResponseEntity<?> uploadMarkdownFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false) String requestedCategory) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Uploaded file is empty"));
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.toLowerCase().endsWith(".md")) {
            return ResponseEntity.badRequest().body(Map.of("error", "File must have a .md extension"));
        }

        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            Map<String, String> fm = extractFrontmatter(content);

            String category = (requestedCategory != null && !requestedCategory.isBlank())
                    ? slugify(requestedCategory)
                    : (fm.containsKey("category") ? slugify(fm.get("category")) : "general");

            String baseName = Paths.get(originalName).getFileName().toString();
            Path notesDir = getNotesDirectory();
            Path categoryDir = notesDir.resolve(category).normalize();
            Files.createDirectories(categoryDir);

            Path targetPath = categoryDir.resolve(baseName).normalize();
            Files.write(targetPath, file.getBytes(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            String relPath = category + "/" + baseName;
            log.info("Uploaded local markdown file: {}", targetPath);

            LocalNoteDto noteDto = parseMarkdownFile(content, relPath, baseName, category);
            noteDto.setSizeBytes(Files.size(targetPath));
            noteDto.setLastModified(Instant.now().toString());

            // 2. Auto-commit to GitHub repository
            boolean gitHubCommitted = gitHubSyncService.commitFile(
                    relPath, content, "docs(vault): upload " + baseName
            );
            if (gitHubCommitted) {
                log.info("Auto-committed uploaded note to GitHub repo {}: {}", gitHubSyncService.getRepo(), relPath);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(noteDto);
        } catch (IOException e) {
            log.error("Failed to save uploaded markdown file: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to save uploaded file: " + e.getMessage()));
        }
    }

    @DeleteMapping
    @Operation(summary = "Delete a local .md note file from frontend/src/content/notes")
    public ResponseEntity<?> deleteNote(@RequestParam("path") String relativePath) {
        if (relativePath == null || relativePath.contains("..")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid path traversal"));
        }

        Path notesDir = getNotesDirectory();
        Path targetFile = notesDir.resolve(relativePath).normalize();

        if (!targetFile.startsWith(notesDir)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }

        try {
            boolean deleted = Files.deleteIfExists(targetFile);
            boolean gitHubDeleted = gitHubSyncService.deleteFile(
                    relativePath, "docs(vault): delete " + relativePath
            );

            if (deleted || gitHubDeleted) {
                log.info("Deleted markdown note file: {} (local={}, github={})", targetFile, deleted, gitHubDeleted);
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "deletedPath", relativePath,
                        "gitHubDeleted", gitHubDeleted
                ));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "File not found"));
            }
        } catch (IOException e) {
            log.error("Failed to delete local markdown file {}: {}", targetFile, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete file: " + e.getMessage()));
        }
    }

    // Helper: Parse markdown content into structured DTO
    private LocalNoteDto parseMarkdownFile(String raw, String relativePath, String filename, String category) {
        Map<String, String> frontmatter = extractFrontmatter(raw);

        String title = frontmatter.getOrDefault("title", stripMdExtension(filename).replace('-', ' '));
        String cat = frontmatter.getOrDefault("category", category);
        String summary = frontmatter.getOrDefault("summary", "");
        String codeLang = frontmatter.getOrDefault("code_language", "java");
        String readTime = frontmatter.getOrDefault("read_time", "3 min read");
        String youtubeUrl = frontmatter.getOrDefault("youtube_url", "");

        // Extract explanation
        String explanation = "";
        Matcher explMatcher = EXPLANATION_PATTERN.matcher(raw);
        if (explMatcher.find()) {
            explanation = explMatcher.group(1).trim();
        } else {
            // If no explicit ## Explanation header, strip frontmatter and code blocks
            String body = raw.replaceFirst("^---[\\s\\S]*?---\\r?\\n", "");
            explanation = body.replaceAll("```[\\s\\S]*?```", "").trim();
        }

        // Extract code block
        String codeSnippet = "";
        Matcher codeMatcher = CODE_BLOCK_PATTERN.matcher(raw);
        if (codeMatcher.find()) {
            String lang = codeMatcher.group(1);
            if (lang != null && !lang.isBlank()) {
                codeLang = lang;
            }
            codeSnippet = codeMatcher.group(2).trim();
        }

        return LocalNoteDto.builder()
                .id("local-" + slugify(relativePath))
                .relativePath(relativePath)
                .filename(filename)
                .category(cat)
                .title(title)
                .summary(summary)
                .explanation(explanation)
                .codeSnippet(codeSnippet)
                .codeLanguage(codeLang)
                .readTime(readTime)
                .youtubeUrl(youtubeUrl)
                .rawContent(raw)
                .build();
    }

    private Map<String, String> extractFrontmatter(String raw) {
        Map<String, String> map = new HashMap<>();
        Matcher m = FRONTMATTER_PATTERN.matcher(raw);
        if (m.find()) {
            String block = m.group(1);
            for (String line : block.split("\\r?\\n")) {
                int colonIdx = line.indexOf(':');
                if (colonIdx > 0) {
                    String k = line.substring(0, colonIdx).trim().toLowerCase();
                    String v = line.substring(colonIdx + 1).trim();
                    // Strip optional quotes
                    if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'"))) {
                        v = v.substring(1, v.length() - 1);
                    }
                    map.put(k, v);
                }
            }
        }
        return map;
    }

    private String buildMarkdownContent(CreateMarkdownNoteRequest req, String category) {
        StringBuilder sb = new StringBuilder();
        sb.append("---\n");
        sb.append("title: ").append(req.getTitle().trim()).append("\n");
        sb.append("category: ").append(category).append("\n");
        sb.append("summary: ").append(req.getSummary() != null ? req.getSummary().trim() : "").append("\n");
        sb.append("code_language: ").append(req.getCodeLanguage() != null && !req.getCodeLanguage().isBlank() ? req.getCodeLanguage().trim() : "java").append("\n");
        sb.append("read_time: ").append(req.getReadTime() != null && !req.getReadTime().isBlank() ? req.getReadTime().trim() : "3 min").append("\n");
        sb.append("youtube_url: \"").append(req.getYoutubeUrl() != null ? req.getYoutubeUrl().trim() : "").append("\"\n");
        sb.append("---\n\n");

        sb.append("## Explanation\n");
        if (req.getExplanation() != null && !req.getExplanation().isBlank()) {
            sb.append(req.getExplanation().trim()).append("\n\n");
        } else {
            sb.append("No explanation provided.\n\n");
        }

        if (req.getCodeSnippet() != null && !req.getCodeSnippet().isBlank()) {
            String lang = req.getCodeLanguage() != null && !req.getCodeLanguage().isBlank() ? req.getCodeLanguage().trim() : "java";
            sb.append("## Code\n");
            sb.append("```").append(lang).append("\n");
            sb.append(req.getCodeSnippet().trim()).append("\n");
            sb.append("```\n");
        }

        return sb.toString();
    }

    private String slugify(String text) {
        if (text == null) return "untitled";
        return text.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }

    private String stripMdExtension(String name) {
        if (name != null && name.toLowerCase().endsWith(".md")) {
            return name.substring(0, name.length() - 3);
        }
        return name;
    }
}

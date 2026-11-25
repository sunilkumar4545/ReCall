package com.recall.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * GitHubVaultSyncService
 * 
 * True GitOps / Zero-DB Remote Storage:
 * Automatically commits, updates, and deletes `.md` files directly in the user's
 * GitHub repository via the GitHub REST API (Contents API).
 * 
 * Works seamlessly in production: when deployed to cloud hosts (Vercel, Render, Railway),
 * any note created via the UI is permanently committed to GitHub, triggering auto-redeployments.
 */
@Slf4j
@Service
public class GitHubVaultSyncService {

    @Value("${github.token:}")
    private String token;

    @Getter
    @Value("${github.repo:sunilkumar4545/ReCall}")
    private String repo;

    @Getter
    @Value("${github.branch:main}")
    private String branch;

    @Getter
    @Value("${github.base-path:frontend/src/content/notes}")
    private String basePath;

    private final RestClient restClient = RestClient.builder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean isEnabled() {
        return token != null && !token.isBlank() && !token.startsWith("your_");
    }

    /**
     * Check if a file exists on GitHub and retrieve its blob SHA.
     */
    public Optional<String> getFileSha(String relativePath) {
        if (!isEnabled()) return Optional.empty();
        String fullPath = cleanPath(basePath + "/" + relativePath);
        String url = String.format("https://api.github.com/repos/%s/contents/%s?ref=%s", repo, fullPath, branch);

        try {
            String response = restClient.get()
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .retrieve()
                    .body(String.class);

            if (response != null) {
                JsonNode node = objectMapper.readTree(response);
                if (node.has("sha")) {
                    return Optional.of(node.get("sha").asText());
                }
            }
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (Exception e) {
            log.warn("GitHub API check for {}: {}", fullPath, e.getMessage());
        }
        return Optional.empty();
    }

    /**
     * Commit (create or update) a markdown file directly into the GitHub repository.
     */
    public boolean commitFile(String relativePath, String content, String commitMessage) {
        if (!isEnabled()) {
            log.info("GitHub sync is disabled (GITHUB_TOKEN not configured). Note saved to local disk only.");
            return false;
        }

        String fullPath = cleanPath(basePath + "/" + relativePath);
        String url = String.format("https://api.github.com/repos/%s/contents/%s", repo, fullPath);
        Optional<String> existingSha = getFileSha(relativePath);

        String base64Content = Base64.getEncoder().encodeToString(content.getBytes(StandardCharsets.UTF_8));

        Map<String, Object> body = new HashMap<>();
        body.put("message", commitMessage != null && !commitMessage.isBlank()
                ? commitMessage
                : "docs(vault): auto-commit " + relativePath);
        body.put("content", base64Content);
        body.put("branch", branch);
        existingSha.ifPresent(sha -> body.put("sha", sha));

        try {
            restClient.put()
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            log.info("[GITHUB SYNC SUCCESS] Committed {} to https://github.com/{}/blob/{}/{}", 
                    relativePath, repo, branch, fullPath);
            return true;
        } catch (Exception e) {
            log.error("[GITHUB SYNC FAILED] Could not commit {} to GitHub: {}", fullPath, e.getMessage());
            return false;
        }
    }

    /**
     * Delete a markdown file directly from the GitHub repository.
     */
    public boolean deleteFile(String relativePath, String commitMessage) {
        if (!isEnabled()) return false;

        String fullPath = cleanPath(basePath + "/" + relativePath);
        String url = String.format("https://api.github.com/repos/%s/contents/%s", repo, fullPath);
        Optional<String> existingSha = getFileSha(relativePath);

        if (existingSha.isEmpty()) {
            log.warn("Cannot delete {} from GitHub: file does not exist on remote branch {}", fullPath, branch);
            return false;
        }

        Map<String, Object> body = Map.of(
                "message", commitMessage != null ? commitMessage : "docs(vault): delete " + relativePath,
                "sha", existingSha.get(),
                "branch", branch
        );

        try {
            restClient.method(org.springframework.http.HttpMethod.DELETE)
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.info("[GITHUB SYNC SUCCESS] Deleted {} from GitHub repository {}", fullPath, repo);
            return true;
        } catch (Exception e) {
            log.error("[GITHUB SYNC FAILED] Could not delete {} from GitHub: {}", fullPath, e.getMessage());
            return false;
        }
    }

    /**
     * Fetch remote notes directly from GitHub repository (used in serverless/cloud environments).
     */
    public List<Map<String, String>> fetchRemoteNotes() {
        if (!isEnabled()) return Collections.emptyList();
        String url = String.format("https://api.github.com/repos/%s/git/trees/%s?recursive=1", repo, branch);

        try {
            String treeResponse = restClient.get()
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .retrieve()
                    .body(String.class);

            if (treeResponse == null) return Collections.emptyList();

            JsonNode root = objectMapper.readTree(treeResponse);
            JsonNode tree = root.path("tree");
            if (!tree.isArray()) return Collections.emptyList();

            String prefix = cleanPath(basePath) + "/";
            List<Map<String, String>> remoteNotes = new ArrayList<>();

            for (JsonNode item : tree) {
                String path = item.path("path").asText("");
                if (path.startsWith(prefix) && path.toLowerCase().endsWith(".md")) {
                    String relativePath = path.substring(prefix.length());
                    // Fetch raw file content
                    try {
                        String rawUrl = String.format("https://raw.githubusercontent.com/%s/%s/%s", repo, branch, path);
                        String rawContent = restClient.get().uri(rawUrl).retrieve().body(String.class);
                        if (rawContent != null) {
                            remoteNotes.add(Map.of(
                                    "relativePath", relativePath,
                                    "rawContent", rawContent,
                                    "sha", item.path("sha").asText("")
                            ));
                        }
                    } catch (Exception ex) {
                        log.warn("Failed to fetch raw content for {}: {}", path, ex.getMessage());
                    }
                }
            }
            return remoteNotes;
        } catch (Exception e) {
            log.warn("Failed to fetch remote tree from GitHub: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private String cleanPath(String p) {
        return p.replace('\\', '/').replaceAll("/+", "/").replaceAll("^/+", "");
    }
}

package com.recall.controller;

import com.recall.dto.request.CreateEntryRequest;
import com.recall.dto.request.UpdateEntryRequest;
import com.recall.dto.response.ApiResponse;
import com.recall.dto.response.RecallEntryResponse;
import com.recall.service.RecallEntryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * RecallEntryController
 * 
 * REST API endpoints for developer memory logs and topic lessons.
 */
@Slf4j
@RestController
@RequestMapping("/api/entries")
@RequiredArgsConstructor
@Tag(name = "Recall Entries Controller", description = "Endpoints for memory logs, code snippets, and lessons")
public class RecallEntryController {

    private final RecallEntryService entryService;

    @GetMapping
    @Operation(summary = "Get all entries", description = "Retrieves all memory log entries, optionally filtered by category")
    public ResponseEntity<ApiResponse<List<RecallEntryResponse>>> getEntries(
            @RequestParam(required = false) String category
    ) {
        List<RecallEntryResponse> entries;
        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("all")) {
            entries = entryService.getEntriesByCategorySlug(category.trim());
        } else {
            entries = entryService.getAllEntries();
        }
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get entry by ID", description = "Retrieves a single memory log entry by its primary key")
    public ResponseEntity<ApiResponse<RecallEntryResponse>> getEntryById(@PathVariable Long id) {
        RecallEntryResponse entry = entryService.getEntryById(id);
        return ResponseEntity.ok(ApiResponse.success(entry));
    }

    @GetMapping("/search")
    @Operation(summary = "Search entries", description = "Searches memory logs across title, summary, and explanation")
    public ResponseEntity<ApiResponse<List<RecallEntryResponse>>> searchEntries(@RequestParam String q) {
        List<RecallEntryResponse> results = entryService.searchEntries(q);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @PostMapping
    @Operation(summary = "Create entry", description = "Indexes a new memory log or lesson with code and media")
    public ResponseEntity<ApiResponse<RecallEntryResponse>> createEntry(
            @Valid @RequestBody CreateEntryRequest request
    ) {
        RecallEntryResponse created = entryService.createEntry(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Memory log entry saved successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update entry", description = "Updates an existing memory log entry")
    public ResponseEntity<ApiResponse<RecallEntryResponse>> updateEntry(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEntryRequest request
    ) {
        RecallEntryResponse updated = entryService.updateEntry(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Memory log entry updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete entry", description = "Removes a memory log entry from the index")
    public ResponseEntity<ApiResponse<Void>> deleteEntry(@PathVariable Long id) {
        entryService.deleteEntry(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Memory log entry deleted successfully"));
    }
}

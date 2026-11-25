package com.recall.controller;

import com.recall.dto.request.CreateCategoryRequest;
import com.recall.dto.response.ApiResponse;
import com.recall.dto.response.CategoryResponse;
import com.recall.service.CategoryService;
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
 * CategoryController
 * 
 * REST API endpoints for managing developer category indexes.
 */
@Slf4j
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Category Controller", description = "Endpoints for managing topic indexes")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Get all categories", description = "Retrieves all indexed topics and their lesson counts")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get category by slug", description = "Retrieves a specific category index by its slug")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryBySlug(@PathVariable String slug) {
        CategoryResponse category = categoryService.getCategoryBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PostMapping
    @Operation(summary = "Create new category", description = "Indexes a new developer topic/field")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        CategoryResponse created = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Category indexed successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete category by ID", description = "Removes a category index and its cascade entries")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Category removed successfully"));
    }

    @DeleteMapping("/slug/{slug}")
    @Operation(summary = "Delete category by slug", description = "Removes a category index by slug")
    public ResponseEntity<ApiResponse<Void>> deleteCategoryBySlug(@PathVariable String slug) {
        categoryService.deleteCategoryBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(null, "Category removed successfully"));
    }
}

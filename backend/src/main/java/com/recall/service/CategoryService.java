package com.recall.service;

import com.recall.dto.request.CreateCategoryRequest;
import com.recall.dto.response.CategoryResponse;

import java.util.List;

/**
 * CategoryService
 * 
 * Interface for managing technical categories and topic indexes.
 */
public interface CategoryService {

    List<CategoryResponse> getAllCategories();

    CategoryResponse getCategoryBySlug(String slug);

    CategoryResponse createCategory(CreateCategoryRequest request);

    void deleteCategory(Long id);

    void deleteCategoryBySlug(String slug);
}

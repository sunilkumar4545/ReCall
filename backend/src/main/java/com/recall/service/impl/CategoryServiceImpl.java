package com.recall.service.impl;

import com.recall.common.exception.BadRequestException;
import com.recall.common.exception.ResourceNotFoundException;
import com.recall.dto.request.CreateCategoryRequest;
import com.recall.dto.response.CategoryResponse;
import com.recall.entity.CategoryEntity;
import com.recall.entity.RecallEntryEntity;
import com.recall.repository.CategoryRepository;
import com.recall.repository.RecallEntryRepository;
import com.recall.service.CategoryService;
import com.recall.storage.ClaimCheckStorageManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CategoryServiceImpl
 * 
 * Implements business logic for technical category indexing.
 * Employs clean, non-spammy request-level logging.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final RecallEntryRepository entryRepository;
    private final ClaimCheckStorageManager claimCheckManager;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        log.info("Fetching all category indexes");
        return categoryRepository.findAllByOrderByIdAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryBySlug(String slug) {
        log.info("Fetching category by slug: '{}'", slug);
        CategoryEntity entity = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with slug: " + slug));
        return mapToResponse(entity);
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        String cleanName = request.getName().trim();
        String slug = request.getSlug();

        if (slug == null || slug.isBlank()) {
            slug = cleanName.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        } else {
            slug = slug.toLowerCase().trim().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        }

        if (categoryRepository.existsBySlug(slug)) {
            throw new BadRequestException("Category index already exists with slug: " + slug);
        }

        log.info("Creating new category: name='{}', slug='{}'", cleanName, slug);

        CategoryEntity entity = CategoryEntity.builder()
                .name(cleanName)
                .slug(slug)
                .build();

        CategoryEntity saved = categoryRepository.save(entity);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        log.info("Deleting category ID={}", id);
        CategoryEntity entity = categoryRepository.findById(id).orElse(null);
        if (entity == null) {
            log.warn("Category ID={} not found or already deleted", id);
            return;
        }

        // Clean up Claim-Check blobs from Backblaze B2 for all entries in this category
        if (entity.getEntries() != null) {
            for (RecallEntryEntity entry : entity.getEntries()) {
                if (entry.getContentKey() != null) {
                    claimCheckManager.deleteContent(entry.getContentKey());
                }
            }
        }

        categoryRepository.delete(entity);
        log.info("Successfully deleted category ID={}", id);
    }

    @Override
    @Transactional
    public void deleteCategoryBySlug(String slug) {
        log.info("Deleting category with slug: '{}'", slug);
        CategoryEntity entity = categoryRepository.findBySlug(slug).orElse(null);
        if (entity == null) {
            log.warn("Category with slug '{}' not found or already deleted", slug);
            return;
        }

        // Clean up Claim-Check blobs from Backblaze B2 for all entries in this category
        if (entity.getEntries() != null) {
            for (RecallEntryEntity entry : entity.getEntries()) {
                if (entry.getContentKey() != null) {
                    claimCheckManager.deleteContent(entry.getContentKey());
                }
            }
        }

        categoryRepository.delete(entity);
        log.info("Successfully deleted category with slug: '{}'", slug);
    }

    private CategoryResponse mapToResponse(CategoryEntity entity) {
        long count = entryRepository.countByCategory_Slug(entity.getSlug());
        return CategoryResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .slug(entity.getSlug())
                .topicCount(count)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}

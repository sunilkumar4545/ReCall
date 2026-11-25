package com.recall.service;

import com.recall.dto.request.CreateEntryRequest;
import com.recall.dto.request.UpdateEntryRequest;
import com.recall.dto.response.RecallEntryResponse;

import java.util.List;

/**
 * RecallEntryService
 * 
 * Interface for managing indexed memory logs and lesson topics.
 */
public interface RecallEntryService {

    List<RecallEntryResponse> getAllEntries();

    List<RecallEntryResponse> getEntriesByCategorySlug(String categorySlug);

    RecallEntryResponse getEntryById(Long id);

    List<RecallEntryResponse> searchEntries(String query);

    RecallEntryResponse createEntry(CreateEntryRequest request);

    RecallEntryResponse updateEntry(Long id, UpdateEntryRequest request);

    void deleteEntry(Long id);
}

package com.recall.service;

import com.recall.dto.response.StorageStatsResponse;

/**
 * StorageStatsService
 * 
 * Provides real-time capacity and quota tracking for Neon PostgreSQL (500 MB)
 * and Backblaze B2 Object Storage (10 GB).
 */
public interface StorageStatsService {

    StorageStatsResponse getStorageStats();
}

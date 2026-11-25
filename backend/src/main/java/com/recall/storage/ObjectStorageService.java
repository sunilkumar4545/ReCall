package com.recall.storage;

/**
 * ObjectStorageService
 * 
 * Abstraction for uploading, retrieving, and deleting compressed blobs
 * under the Claim-Check pattern.
 */
public interface ObjectStorageService {

    /**
     * Uploads compressed bytes to object storage under the specified key.
     * 
     * @param key unique path/key in storage (e.g. entries/spring-boot/10-abc.json.gz)
     * @param compressedData GZIP compressed payload bytes
     * @param contentType MIME type (e.g. application/gzip)
     * @return storage key or public/presigned URL
     */
    String upload(String key, byte[] compressedData, String contentType);

    /**
     * Downloads compressed bytes by storage key.
     * 
     * @param key unique path/key in storage
     * @return raw GZIP-compressed bytes
     */
    byte[] download(String key);

    /**
     * Deletes a blob by key from object storage.
     */
    void delete(String key);

    /**
     * Checks if a blob exists by key.
     */
    boolean exists(String key);

    /**
     * Name of the storage provider (e.g., S3_BACKBLAZE, S3_TIGRIS, LOCAL_DISK).
     */
    String getStorageType();
}

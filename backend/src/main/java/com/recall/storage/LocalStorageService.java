package com.recall.storage;

import com.recall.storage.config.StorageProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * LocalStorageService
 * 
 * Local disk implementation for Claim-Check compressed blobs.
 * Used as default fallback when cloud object storage (Backblaze B2 / Tigris)
 * credentials are not yet configured, ensuring zero setup friction.
 */
@Slf4j
@Service
public class LocalStorageService implements ObjectStorageService {

    private final Path basePath;

    public LocalStorageService(StorageProperties properties) {
        this.basePath = Paths.get(properties.getLocal().getBaseDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.basePath);
            log.info("Initialized local Claim-Check blob storage directory at: {}", this.basePath);
        } catch (IOException e) {
            log.error("Failed to create local storage directory: {}", this.basePath, e);
        }
    }

    @Override
    public String upload(String key, byte[] compressedData, String contentType) {
        Path filePath = basePath.resolve(key).normalize();
        try {
            Files.createDirectories(filePath.getParent());
            Files.write(filePath, compressedData);
            log.debug("Stored compressed blob locally: {} ({} bytes)", filePath, compressedData.length);
            return key;
        } catch (IOException e) {
            log.error("Failed to store blob locally at {}", filePath, e);
            throw new RuntimeException("Local storage write error: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] download(String key) {
        Path filePath = basePath.resolve(key).normalize();
        if (!Files.exists(filePath)) {
            log.warn("Local blob not found: {}", filePath);
            return new byte[0];
        }
        try {
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("Failed to read local blob at {}", filePath, e);
            throw new RuntimeException("Local storage read error: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String key) {
        Path filePath = basePath.resolve(key).normalize();
        try {
            Files.deleteIfExists(filePath);
            log.debug("Deleted local blob: {}", filePath);
        } catch (IOException e) {
            log.warn("Failed to delete local blob {}: {}", filePath, e.getMessage());
        }
    }

    @Override
    public boolean exists(String key) {
        Path filePath = basePath.resolve(key).normalize();
        return Files.exists(filePath);
    }

    @Override
    public String getStorageType() {
        return "LOCAL_COMPRESSED_STORAGE";
    }
}

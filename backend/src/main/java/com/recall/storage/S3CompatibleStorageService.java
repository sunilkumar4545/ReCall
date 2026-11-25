package com.recall.storage;

import com.recall.storage.config.StorageProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.net.URI;

/**
 * S3CompatibleStorageService
 * 
 * Production S3-compatible client for Free Object Storage:
 * - Backblaze B2 (10 GB free forever, zero setup cost)
 * - Tigris Data (5 GB free, zero egress fees)
 * - Cloudflare R2 / AWS S3 / MinIO
 */
@Slf4j
@Service
public class S3CompatibleStorageService implements ObjectStorageService {

    private final StorageProperties properties;
    private S3Client s3Client;
    private boolean initialized = false;

    public S3CompatibleStorageService(StorageProperties properties) {
        this.properties = properties;
        initializeClient();
    }

    private synchronized void initializeClient() {
        StorageProperties.S3 s3 = properties.getS3();
        if (!s3.isConfigured()) {
            log.info("S3 object storage is not fully configured. Using fallback local storage.");
            return;
        }

        try {
            AwsBasicCredentials credentials = AwsBasicCredentials.create(s3.getAccessKey().trim(), s3.getSecretKey().trim());

            String endpoint = s3.getEndpoint().trim();
            if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
                endpoint = "https://" + endpoint;
            }

            this.s3Client = S3Client.builder()
                    .endpointOverride(URI.create(endpoint))
                    .region(Region.of(s3.getRegion() != null && !s3.getRegion().isBlank() ? s3.getRegion().trim() : "us-east-1"))
                    .credentialsProvider(StaticCredentialsProvider.create(credentials))
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(s3.isPathStyleAccess())
                            .build())
                    .build();

            this.initialized = true;
            log.info("Initialized S3-compatible Object Storage for bucket '{}' at endpoint: {}", 
                    s3.getBucket(), s3.getEndpoint());
        } catch (Exception e) {
            log.error("Failed to initialize S3 Object Storage client: {}", e.getMessage(), e);
            this.initialized = false;
        }
    }

    public boolean isReady() {
        return initialized && s3Client != null;
    }

    @Override
    public String upload(String key, byte[] compressedData, String contentType) {
        if (!isReady()) {
            throw new IllegalStateException("S3 client is not initialized");
        }

        String bucket = properties.getS3().getBucket();
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType != null ? contentType : "application/gzip")
                    .contentEncoding("gzip")
                    .contentLength((long) compressedData.length)
                    .build();

            s3Client.putObject(request, RequestBody.fromBytes(compressedData));
            log.info("Uploaded Claim-Check blob to S3 [{}/{}]: {} bytes", bucket, key, compressedData.length);
            return key;
        } catch (S3Exception e) {
            log.error("S3 upload failed for bucket='{}', key='{}': {}", bucket, key, e.awsErrorDetails().errorMessage());
            throw new RuntimeException("S3 upload error: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] download(String key) {
        if (!isReady()) {
            throw new IllegalStateException("S3 client is not initialized");
        }

        String bucket = properties.getS3().getBucket();
        try {
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            try (ResponseInputStream<GetObjectResponse> is = s3Client.getObject(request)) {
                return is.readAllBytes();
            }
        } catch (NoSuchKeyException e) {
            log.warn("S3 blob key not found: {}/{}", bucket, key);
            return new byte[0];
        } catch (IOException | S3Exception e) {
            log.error("S3 download failed for key='{}': {}", key, e.getMessage());
            throw new RuntimeException("S3 download error: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String key) {
        if (!isReady()) return;

        String bucket = properties.getS3().getBucket();
        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            s3Client.deleteObject(request);
            log.info("Deleted Claim-Check blob from S3: {}/{}", bucket, key);
        } catch (S3Exception e) {
            log.warn("Failed to delete S3 blob {}/{}: {}", bucket, key, e.getMessage());
        }
    }

    @Override
    public boolean exists(String key) {
        if (!isReady()) return false;

        String bucket = properties.getS3().getBucket();
        try {
            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();
            s3Client.headObject(request);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            return false;
        }
    }

    @Override
    public String getStorageType() {
        return "S3_COMPATIBLE_STORAGE";
    }
}

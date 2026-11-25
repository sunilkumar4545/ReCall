package com.recall.storage;

import com.recall.common.util.GzipCompressionUtil;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.*;

import java.net.URI;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

public class BackblazeB2ConnectionTest {

    @Test
    public void testBackblazeB2ConnectionAndGzipPipeline() throws Exception {
        String endpoint = System.getenv().getOrDefault("STORAGE_S3_ENDPOINT", "https://s3.us-east-005.backblazeb2.com");
        String bucket = System.getenv().getOrDefault("STORAGE_S3_BUCKET", "recall4224");
        String accessKey = System.getenv().getOrDefault("STORAGE_S3_ACCESS_KEY", "your_access_key");
        String secretKey = System.getenv().getOrDefault("STORAGE_S3_SECRET_KEY", "your_secret_key");
        String region = System.getenv().getOrDefault("STORAGE_S3_REGION", "us-east-005");

        if ("your_access_key".equals(accessKey) || "your_secret_key".equals(secretKey)) {
            System.out.println("Skipping live B2 connection test: credentials not set in environment.");
            return;
        }

        S3Client s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();

        // 1. Verify Bucket Head
        HeadBucketResponse headBucketResponse = s3Client.headBucket(
                HeadBucketRequest.builder().bucket(bucket).build());
        assertNotNull(headBucketResponse);
        System.out.println(">>> SUCCESS: Connected to Backblaze B2 bucket: " + bucket);

        // 2. Prepare Sample Blog & Code Payload
        String rawText = "Inversion of Control (IoC) with Spring Boot. Compression test payload with Java code: public class Test {}";
        byte[] compressedBytes = GzipCompressionUtil.compress(rawText);
        System.out.printf(">>> GZIP Compression: Raw=%d bytes -> Compressed=%d bytes (%.1f%% saved)%n",
                rawText.getBytes(StandardCharsets.UTF_8).length,
                compressedBytes.length,
                GzipCompressionUtil.calculateSavingsPercentage(rawText.getBytes(StandardCharsets.UTF_8).length, compressedBytes.length));

        // 3. Upload to B2
        String testKey = "test/claim-check-verification.json.gz";
        s3Client.putObject(PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(testKey)
                        .contentType("application/gzip")
                        .contentEncoding("gzip")
                        .build(),
                RequestBody.fromBytes(compressedBytes));
        System.out.println(">>> SUCCESS: Uploaded compressed blob to B2 key: " + testKey);

        // 4. Download and Decompress
        byte[] downloadedBytes = s3Client.getObjectAsBytes(GetObjectRequest.builder()
                .bucket(bucket)
                .key(testKey)
                .build()).asByteArray();

        String decompressedText = GzipCompressionUtil.decompress(downloadedBytes);
        assertEquals(rawText, decompressedText);
        System.out.println(">>> SUCCESS: Downloaded and verified decompressed payload: " + decompressedText);

        // 5. Clean up test blob
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(testKey).build());
        System.out.println(">>> SUCCESS: Cleaned up test blob from Backblaze B2.");
        s3Client.close();
    }
}

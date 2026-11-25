package com.recall.storage.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * StorageProperties
 * 
 * Binds object storage settings from application.yml for the Claim-Check pattern.
 * Supports Backblaze B2, Tigris Data, Cloudflare R2, MinIO, AWS S3, and Local disk.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "storage")
public class StorageProperties {

    /**
     * Storage type: "auto", "s3", or "local"
     */
    private String type = "auto";

    private Local local = new Local();
    private S3 s3 = new S3();

    @Getter
    @Setter
    public static class Local {
        private String baseDir = "./data/storage/blobs";
    }

    @Getter
    @Setter
    public static class S3 {
        private boolean enabled = false;
        private String endpoint = "";
        private String bucket = "";
        private String accessKey = "";
        private String secretKey = "";
        private String region = "us-east-1";
        private boolean pathStyleAccess = true;

        public boolean isConfigured() {
            return endpoint != null && !endpoint.isBlank()
                    && bucket != null && !bucket.isBlank()
                    && accessKey != null && !accessKey.isBlank()
                    && secretKey != null && !secretKey.isBlank();
        }
    }
}

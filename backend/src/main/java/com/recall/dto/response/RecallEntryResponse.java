package com.recall.dto.response;

import lombok.*;

import java.time.Instant;

/**
 * RecallEntryResponse
 * 
 * Response model for an indexed memory log entry / lesson.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecallEntryResponse {

    private Long id;
    private String categorySlug;
    private String categoryName;
    private String title;
    private String summary;
    private String explanation;
    private String codeLanguage;
    private String codeSnippet;
    private String imageUrl;
    private String youtubeUrl;
    private String youtubeEmbedUrl;
    private String pdfUrl;
    private String pdfName;
    private String readTime;
    
    // Claim-Check Reference Telemetry
    private String contentKey;
    private Long contentSizeBytes;
    private Long compressedSizeBytes;
    private Double savingsPercentage;

    private Instant createdAt;
    private Instant updatedAt;
}

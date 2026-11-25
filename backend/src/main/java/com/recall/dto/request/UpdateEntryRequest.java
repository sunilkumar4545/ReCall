package com.recall.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * UpdateEntryRequest
 * 
 * Payload to update an existing entry.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateEntryRequest {

    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    private String summary;

    private String explanation;

    private String codeLanguage;

    private String codeSnippet;

    private String imageUrl;

    private String youtubeUrl;

    private String pdfUrl;

    private String pdfName;
}

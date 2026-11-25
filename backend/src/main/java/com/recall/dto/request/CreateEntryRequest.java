package com.recall.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * CreateEntryRequest
 * 
 * Payload to create an indexed developer memory log / topic lesson.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEntryRequest {

    @NotBlank(message = "Category slug is required")
    private String categorySlug;

    @NotBlank(message = "Entry title cannot be empty")
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

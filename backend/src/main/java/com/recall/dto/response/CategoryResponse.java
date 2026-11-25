package com.recall.dto.response;

import lombok.*;

import java.time.Instant;

/**
 * CategoryResponse
 * 
 * Response model for categories with indexed topic counts.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {

    private Long id;
    private String name;
    private String slug;
    private long topicCount;
    private Instant createdAt;
}

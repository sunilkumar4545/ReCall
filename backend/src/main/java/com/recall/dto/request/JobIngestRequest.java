package com.recall.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobIngestRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String company;

    private String location;

    @NotBlank(message = "Apply URL is required")
    private String applyUrl;

    private String description;

    private String channelTitle;

    private String channelUsername;

    private Instant postedAt;

    private String contentHash;
}

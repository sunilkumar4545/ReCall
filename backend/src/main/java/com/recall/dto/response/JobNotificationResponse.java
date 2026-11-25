package com.recall.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobNotificationResponse {

    private Long id;
    private String title;
    private String company;
    private String location;
    private String applyUrl;
    private String description;
    private String channelTitle;
    private String channelUsername;
    private Instant postedAt;
    private Instant createdAt;
}

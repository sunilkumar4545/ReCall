package com.recall.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobStatsResponse {

    private long totalJobs;
    private int maxCapacity;
    private double estimatedSizeKb;
    private Instant newestPostedAt;
}

package com.recall.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {

    private String reply;
    private String modelUsed;
    private String provider;
    private List<String> referencedNotes;
    private Instant timestamp;

    // Real-Time Token Telemetry & Quota Gauges
    private Integer promptTokens;
    private Integer completionTokens;
    private Integer messageTokens;
    private Long totalTokensUsed;
    private Long tokenLimit;
    private Double usagePercentage;
    private Long tokensRemaining;
}

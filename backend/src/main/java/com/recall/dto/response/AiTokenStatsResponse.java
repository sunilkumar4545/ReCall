package com.recall.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiTokenStatsResponse {

    private Long totalTokensUsed;
    private Long tokenLimit;
    private Double usagePercentage;
    private Long tokensRemaining;
    private Integer totalQueries;
}

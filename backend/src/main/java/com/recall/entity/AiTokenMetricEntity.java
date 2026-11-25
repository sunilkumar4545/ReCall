package com.recall.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "ai_token_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiTokenMetricEntity {

    @Id
    @Column(name = "id", length = 50, nullable = false)
    private String id;

    @Column(name = "total_tokens_used", nullable = false)
    private Long totalTokensUsed;

    @Column(name = "total_queries", nullable = false)
    private Integer totalQueries;

    @Column(name = "prompt_tokens_used", nullable = false)
    private Long promptTokensUsed;

    @Column(name = "completion_tokens_used", nullable = false)
    private Long completionTokensUsed;

    @Column(name = "token_limit", nullable = false)
    private Long tokenLimit;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}

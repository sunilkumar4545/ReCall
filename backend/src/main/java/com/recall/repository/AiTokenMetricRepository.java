package com.recall.repository;

import com.recall.entity.AiTokenMetricEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiTokenMetricRepository extends JpaRepository<AiTokenMetricEntity, String> {
}

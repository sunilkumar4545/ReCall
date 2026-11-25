package com.recall.repository;

import com.recall.entity.JobNotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobNotificationRepository extends JpaRepository<JobNotificationEntity, Long> {

    boolean existsByContentHash(String contentHash);

    Optional<JobNotificationEntity> findByContentHash(String contentHash);

    List<JobNotificationEntity> findTop150ByOrderByPostedAtDesc();

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM job_notifications WHERE id NOT IN (SELECT id FROM job_notifications ORDER BY posted_at DESC LIMIT :limit)", nativeQuery = true)
    void purgeBeyondLimit(@Param("limit") int limit);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM job_notifications WHERE apply_url NOT LIKE 'http%' OR apply_url LIKE '%youtu%' OR apply_url LIKE '%t.me/joinchat%' OR apply_url LIKE '%t.me/+%'", nativeQuery = true)
    void purgeMalformedUrls();
}

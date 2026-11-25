package com.recall.repository;

import com.recall.entity.RecallEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecallEntryRepository extends JpaRepository<RecallEntryEntity, Long> {

    List<RecallEntryEntity> findAllByOrderByCreatedAtDesc();

    List<RecallEntryEntity> findByCategory_SlugOrderByCreatedAtDesc(String slug);

    long countByCategory_Slug(String slug);

    @Query("SELECT e FROM RecallEntryEntity e WHERE " +
           "LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.summary) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.explanation) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY e.createdAt DESC")
    List<RecallEntryEntity> searchEntries(@Param("query") String query);
}

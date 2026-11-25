package com.recall.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * RecallEntryEntity
 * 
 * Represents an indexed developer blog / memory log entry containing
 * rich technical notes, code snippets, embedded YouTube videos, and PDF links.
 */
@Entity
@Table(name = "recall_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecallEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private CategoryEntity category;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "code_language", length = 50)
    private String codeLanguage;

    @Column(name = "code_snippet", columnDefinition = "TEXT")
    private String codeSnippet;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "youtube_url", length = 1000)
    private String youtubeUrl;

    @Column(name = "youtube_embed_url", length = 1000)
    private String youtubeEmbedUrl;

    @Column(name = "pdf_url", length = 1000)
    private String pdfUrl;

    @Column(name = "pdf_name")
    private String pdfName;

    // --- Claim-Check Reference Pattern Fields (Protects Neon 500 MB DB Limit) ---
    @Column(name = "content_key", length = 500)
    private String contentKey;

    @Column(name = "content_url", length = 1000)
    private String contentUrl;

    @Column(name = "compression_type", length = 50)
    @Builder.Default
    private String compressionType = "GZIP";

    @Column(name = "content_size_bytes")
    @Builder.Default
    private Long contentSizeBytes = 0L;

    @Column(name = "compressed_size_bytes")
    @Builder.Default
    private Long compressedSizeBytes = 0L;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}

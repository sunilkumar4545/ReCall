package com.recall.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "job_notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobNotificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_hash", length = 64, nullable = false, unique = true)
    private String contentHash;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "company", length = 150)
    private String company;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "apply_url", nullable = false, columnDefinition = "TEXT")
    private String applyUrl;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "channel_title", length = 150)
    private String channelTitle;

    @Column(name = "channel_username", length = 100)
    private String channelUsername;

    @Column(name = "posted_at")
    private Instant postedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}

package com.recall.service.impl;

import com.recall.dto.request.JobIngestRequest;
import com.recall.dto.response.JobNotificationResponse;
import com.recall.dto.response.JobStatsResponse;
import com.recall.entity.JobNotificationEntity;
import com.recall.repository.JobNotificationRepository;
import com.recall.service.JobNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobNotificationServiceImpl implements JobNotificationService {

    private static final int MAX_BUFFER_LIMIT = 150;
    private final JobNotificationRepository jobRepository;

    @Override
    @Transactional
    public JobNotificationResponse ingestJob(JobIngestRequest request) {
        String applyUrl = request.getApplyUrl() != null ? request.getApplyUrl().trim() : "";
        if (applyUrl.isBlank()) {
            throw new IllegalArgumentException("Apply URL cannot be blank");
        }

        // Generate SHA-256 hash if not supplied
        String hash = request.getContentHash();
        if (hash == null || hash.isBlank()) {
            hash = computeHash(applyUrl);
        }

        // Deduplication: if exact apply URL already ingested, ignore gracefully
        if (jobRepository.existsByContentHash(hash)) {
            log.info("Duplicate job notification skipped (hash: {})", hash);
            JobNotificationEntity existing = jobRepository.findByContentHash(hash).orElseThrow();
            return mapToResponse(existing);
        }

        JobNotificationEntity entity = JobNotificationEntity.builder()
                .contentHash(hash)
                .title(truncate(request.getTitle(), 255))
                .company(truncate(request.getCompany(), 150))
                .location(truncate(request.getLocation(), 100))
                .applyUrl(applyUrl)
                .description(truncate(request.getDescription(), 500))
                .channelTitle(truncate(request.getChannelTitle(), 150))
                .channelUsername(truncate(request.getChannelUsername(), 100))
                .postedAt(request.getPostedAt() != null ? request.getPostedAt() : Instant.now())
                .build();

        JobNotificationEntity saved = jobRepository.save(entity);
        log.info("Ingested new job notification: '{}' at '{}' from channel '{}'",
                saved.getTitle(), saved.getCompany(), saved.getChannelTitle());

        // Enforce Circular FIFO Hard Cap (Max 150 records)
        long currentCount = jobRepository.count();
        if (currentCount > MAX_BUFFER_LIMIT) {
            jobRepository.purgeBeyondLimit(MAX_BUFFER_LIMIT);
            log.info("Purged oldest job notifications to maintain strict {} buffer limit", MAX_BUFFER_LIMIT);
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobNotificationResponse> getRecentJobs(String query, String filter, Integer limit) {
        int max = (limit != null && limit > 0) ? Math.min(limit, MAX_BUFFER_LIMIT) : MAX_BUFFER_LIMIT;
        List<JobNotificationEntity> allJobs = jobRepository.findTop150ByOrderByPostedAtDesc();

        return allJobs.stream()
                .filter(job -> {
                    if (query == null || query.isBlank()) return true;
                    String q = query.toLowerCase();
                    boolean matchTitle = job.getTitle() != null && job.getTitle().toLowerCase().contains(q);
                    boolean matchCompany = job.getCompany() != null && job.getCompany().toLowerCase().contains(q);
                    boolean matchDesc = job.getDescription() != null && job.getDescription().toLowerCase().contains(q);
                    boolean matchLocation = job.getLocation() != null && job.getLocation().toLowerCase().contains(q);
                    return matchTitle || matchCompany || matchDesc || matchLocation;
                })
                .filter(job -> {
                    if (filter == null || filter.isBlank() || "all".equalsIgnoreCase(filter)) return true;
                    String f = filter.toLowerCase();
                    String fullText = ((job.getTitle() != null ? job.getTitle() : "") + " " +
                                       (job.getDescription() != null ? job.getDescription() : "") + " " +
                                       (job.getLocation() != null ? job.getLocation() : "")).toLowerCase();
                    return fullText.contains(f);
                })
                .limit(max)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteJob(Long id) {
        jobRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public JobStatsResponse getStats() {
        long count = jobRepository.count();
        List<JobNotificationEntity> top = jobRepository.findTop150ByOrderByPostedAtDesc();
        Instant newest = top.isEmpty() ? null : top.get(0).getPostedAt();

        // Estimated DB footprint: ~500 bytes per record
        double sizeKb = Math.round((count * 500.0 / 1024.0) * 100.0) / 100.0;

        return JobStatsResponse.builder()
                .totalJobs(count)
                .maxCapacity(MAX_BUFFER_LIMIT)
                .estimatedSizeKb(sizeKb)
                .newestPostedAt(newest)
                .build();
    }

    private JobNotificationResponse mapToResponse(JobNotificationEntity entity) {
        return JobNotificationResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .company(entity.getCompany())
                .location(entity.getLocation())
                .applyUrl(entity.getApplyUrl())
                .description(entity.getDescription())
                .channelTitle(entity.getChannelTitle())
                .channelUsername(entity.getChannelUsername())
                .postedAt(entity.getPostedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private String computeHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(input.hashCode());
        }
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return null;
        text = text.trim();
        return text.length() <= maxLength ? text : text.substring(0, maxLength);
    }
}

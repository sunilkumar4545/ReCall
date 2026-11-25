package com.recall.service;

import com.recall.dto.request.JobIngestRequest;
import com.recall.dto.response.JobNotificationResponse;
import com.recall.dto.response.JobStatsResponse;

import java.util.List;

public interface JobNotificationService {

    JobNotificationResponse ingestJob(JobIngestRequest request);

    List<JobNotificationResponse> getRecentJobs(String query, String filter, Integer limit);

    void deleteJob(Long id);

    JobStatsResponse getStats();
}

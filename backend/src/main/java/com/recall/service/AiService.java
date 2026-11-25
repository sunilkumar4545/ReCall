package com.recall.service;

import com.recall.dto.request.AiChatRequest;
import com.recall.dto.response.AiChatResponse;
import com.recall.dto.response.AiTokenStatsResponse;

public interface AiService {
    AiChatResponse chat(AiChatRequest request);
    AiTokenStatsResponse getTokenStats();
}

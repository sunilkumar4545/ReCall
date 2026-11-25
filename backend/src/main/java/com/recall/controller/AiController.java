package com.recall.controller;

import com.recall.dto.request.AiChatRequest;
import com.recall.dto.response.AiChatResponse;
import com.recall.dto.response.AiTokenStatsResponse;
import com.recall.dto.response.ApiResponse;
import com.recall.service.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Tutor & Interview Assistant", description = "RAG-powered interactive interview assistant with live token telemetry")
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    @Operation(summary = "Query the AI tutor with RAG context over saved notes")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(@Valid @RequestBody AiChatRequest request) {
        AiChatResponse response = aiService.chat(request);
        return ResponseEntity.ok(ApiResponse.success(response, "AI response generated"));
    }

    @GetMapping("/tokens")
    @Operation(summary = "Get live AI token usage and quota telemetry")
    public ResponseEntity<ApiResponse<AiTokenStatsResponse>> getTokenStats() {
        return ResponseEntity.ok(ApiResponse.success(aiService.getTokenStats(), "Token stats retrieved"));
    }
}

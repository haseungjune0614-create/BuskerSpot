package com.buskerspot.controller;

import com.buskerspot.dto.ai.AiRecommendRequest;
import com.buskerspot.dto.ai.AiRecommendResponse;
import com.buskerspot.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 기존 buskerspot-backend-node/app.py (Streamlit) + agent.py (LangGraph) 를 대체하는 엔드포인트.
 * 프론트엔드 ai_recommendation.jsx 에서 POST /api/ai/recommend 로 호출하도록 연결하면 됨.
 *
 * 만약 이미 프로젝트에 AiController.java가 있다면, 이 recommend() 메서드만 옮겨 붙이면 됩니다.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/recommend")
    public AiRecommendResponse recommend(@RequestBody AiRecommendRequest request) {
        return aiService.getAiRecommendation(request.getQuery(), request.getChatHistory());
    }
}
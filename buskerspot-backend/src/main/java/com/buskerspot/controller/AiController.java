package com.buskerspot.controller;

import com.buskerspot.dto.ai.AiRecommendRequest;
import com.buskerspot.dto.ai.AiRecommendResponse;
import com.buskerspot.service.AiService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 기존 buskerspot-backend-node/app.py (Streamlit) + agent.py (LangGraph) 를 대체하는 엔드포인트.
 * 프론트엔드 ai_recommendation.jsx 에서 POST /api/ai/recommend 로 호출하도록 연결하면 됨.
 *
 * 만약 이미 프로젝트에 AiController.java가 있다면, 이 recommend() 메서드만 옮겨 붙이면 됩니다.
 *
 * [수정 6] LLM 호출 비용이 드는 엔드포인트이므로 IP 기준 슬라이딩 윈도우 레이트리밋을 추가했다.
 * 이 구현은 인메모리라서 단일 인스턴스에서만 정확하다.
 * 서버를 여러 대로 확장할 계획이라면 Bucket4j + Redis 등 외부 저장소 기반으로 교체 권장.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private static final int MAX_REQUESTS_PER_WINDOW = 10;
    private static final long WINDOW_MS = 60 * 1000L; // 1분

    private final AiService aiService;
    private final ConcurrentHashMap<String, Deque<Long>> requestLog = new ConcurrentHashMap<>();

    @PostMapping("/recommend")
    public AiRecommendResponse recommend(@Valid @RequestBody AiRecommendRequest request, HttpServletRequest httpRequest) {
        String clientKey = resolveClientKey(httpRequest);
        checkRateLimit(clientKey);

        return aiService.getAiRecommendation(request.getQuery(), request.getChatHistory());
    }

    private String resolveClientKey(HttpServletRequest httpRequest) {
        String forwarded = httpRequest.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return httpRequest.getRemoteAddr();
    }

    private void checkRateLimit(String clientKey) {
        long now = System.currentTimeMillis();
        Deque<Long> timestamps = requestLog.computeIfAbsent(clientKey, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MS) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= MAX_REQUESTS_PER_WINDOW) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
            }
            timestamps.addLast(now);
        }
    }
}
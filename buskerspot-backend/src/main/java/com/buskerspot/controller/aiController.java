package com.buskerspot.controller;

import com.buskerspot.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    // AI 공연 추천 및 질문 처리 API
    @PostMapping("/recommend")
    public ResponseEntity<?> getRecommendation(@RequestBody Map<String, Object> request) {
        String prompt = (String) request.get("prompt");
        Object user = request.get("user");

        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.status(400).json(Map.of("success", false, "message", "질문 내용을 입력해주세요."));
        }

        Map<String, Object> result = aiService.getRecommendation(prompt, user);
        return ResponseEntity.ok(result);
    }
}
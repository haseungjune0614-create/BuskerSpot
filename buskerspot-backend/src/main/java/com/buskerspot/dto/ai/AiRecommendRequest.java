package com.buskerspot.dto.ai;

import lombok.Data;

import java.util.List;

@Data
public class AiRecommendRequest {

    /** 사용자 자연어 질의 (예: "홍대 근처 잔잔한 어쿠스틱 버스킹 추천해줘") */
    private String query;

    /** 최근 대화 기록 (최대 3개만 프롬프트에 반영됨) */
    private List<ChatMessage> chatHistory;

    @Data
    public static class ChatMessage {
        private String role;    // "user" | "assistant"
        private String content;
    }
}
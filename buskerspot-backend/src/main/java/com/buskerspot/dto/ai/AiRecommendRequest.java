package com.buskerspot.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class AiRecommendRequest {

    /** 사용자 자연어 질의 (예: "홍대 근처 잔잔한 어쿠스틱 버스킹 추천해줘") */
    // [수정 3] null/빈 문자열 요청을 컨트롤러 진입 단계에서 400으로 차단 (서비스단 방어 코드와 이중 방어)
    @NotBlank(message = "query는 비어 있을 수 없습니다.")
    @Size(max = 500, message = "query는 500자를 초과할 수 없습니다.")
    private String query;

    /** 최근 대화 기록 (최대 3개만 프롬프트에 반영됨) */
    private List<ChatMessage> chatHistory;

    @Data
    public static class ChatMessage {
        private String role;    // "user" | "assistant"
        private String content;
    }
}
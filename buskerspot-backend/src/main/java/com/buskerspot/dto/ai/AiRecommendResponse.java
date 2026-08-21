package com.buskerspot.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiRecommendResponse {

    /** AI 종합 코멘트 (예: "요청하신 조건에 맞는 무대를 모아보았어요! 🎶") */
    private String report;

    /** 추천 공연 목록. 각 원소는 performances 테이블 컬럼 + aiReviewQuote / aiReasonText 를 포함한 맵 */
    private List<Map<String, Object>> recommendations;
}
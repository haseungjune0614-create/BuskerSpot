package com.buskerspot.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
public class AiRecommendResponse {

    private String report;
    private List<Map<String, Object>> recommendations;
    private boolean moodBased;

    public AiRecommendResponse(String report, List<Map<String, Object>> recommendations) {
        this(report, recommendations, false);
    }

    public AiRecommendResponse(String report, List<Map<String, Object>> recommendations, boolean moodBased) {
        this.report = report;
        this.recommendations = recommendations;
        this.moodBased = moodBased;
    }
}
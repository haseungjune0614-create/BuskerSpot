package com.buskerspot.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * agent.py 의 analyze_query_with_llm() 결과에 대응.
 * LLM이 반환하는 JSON 필드명(has_region 등)을 그대로 매핑한다.
 */
@Data
public class QueryAnalysis {

    @JsonProperty("has_region")
    private boolean hasRegion;

    @JsonProperty("has_time")
    private boolean hasTime;

    @JsonProperty("matched_text")
    private String matchedText;

    @JsonProperty("time_start")
    private String timeStart;

    private String genre;

    @JsonProperty("artist_name")
    private String artistName;

    @JsonProperty("target_date")
    private String targetDate;

    // 추가
    private String mood; // 예: "지친 하루", "설렘", "혼자만의 시간" 등, 없으면 null

    @JsonProperty("mood_intensity")
    private String moodIntensity; // "low" | "medium" | "high" | null

    public static QueryAnalysis empty() {
        return new QueryAnalysis();
    }
}
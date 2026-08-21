package com.buskerspot.service;

import com.buskerspot.dto.ai.AiRecommendRequest;
import com.buskerspot.dto.ai.AiRecommendResponse;
import com.buskerspot.dto.ai.QueryAnalysis;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.*;

/**
 * buskerspot-backend-node/agent.py (LangGraph + Groq) 를 이식한 서비스.
 *
 * 원본 파이썬 파이프라인:
 *   load_data_node  -> fetch_performances_from_db() : distinct region 조회 + LLM 의도분석 + 동적 SQL 조회
 *   recommend_node  -> LLM에게 후보 중 최대 3개를 골라 리포트/추천사유를 받음
 *
 * Groq API를 REST로 직접 호출하는 방식으로 변경했고(랭체인 대신 RestTemplate),
 * 나머지 SQL/프롬프트 로직은 최대한 동일하게 유지했습니다.
 *
 * application.yml에 아래 프로퍼티 추가 필요:
 *   groq:
 *     api-key: ${GROQ_API_KEY}
 */
@Slf4j
@Service
public class AiService {

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.1-8b-instant";
    private static final List<String> REGION_HINT_KEYWORDS =
            List.of("노원", "서현", "강남", "부산", "홍대");

    private final JdbcTemplate jdbcTemplate;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${api.groq.key}")
    private String groqApiKey;

    public AiService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    // =========================================================
    // 진입점 (agent.py의 get_ai_recommendation)
    // =========================================================
    public AiRecommendResponse getAiRecommendation(String userQuery, List<AiRecommendRequest.ChatMessage> chatHistory) {
        if (chatHistory == null) {
            chatHistory = List.of();
        }

        DbFetchResult fetched = fetchPerformancesFromDb(userQuery, chatHistory);

        if (fetched.dbRows.isEmpty()) {
            return new AiRecommendResponse("현재 기준 예정된 공연 정보가 없습니다.", List.of());
        }

        return buildRecommendation(userQuery, fetched);
    }

    // =========================================================
    // 1단계: distinct region 조회 (agent.py의 get_distinct_regions)
    // =========================================================
    private List<String> getDistinctRegions() {
        try {
            return jdbcTemplate.queryForList(
                    "SELECT DISTINCT region FROM performances WHERE region IS NOT NULL",
                    String.class
            );
        } catch (Exception e) {
            log.warn("[Region Fetch Warning] {}", e.getMessage());
            return List.of();
        }
    }

    // =========================================================
    // 2단계: LLM 의도 분석 (agent.py의 analyze_query_with_llm)
    // =========================================================
    private QueryAnalysis analyzeQueryWithLlm(String userQuery, List<AiRecommendRequest.ChatMessage> chatHistory, List<String> distinctRegions) {
        try {
            String regionsStr = distinctRegions.isEmpty() ? "등록된 지역 없음" : String.join(", ", distinctRegions);
            String currentDateStr = LocalDate.now().toString();

            StringBuilder historyStr = new StringBuilder();
            if (chatHistory.isEmpty()) {
                historyStr.append("이전 대화 없음");
            } else {
                int from = Math.max(0, chatHistory.size() - 3);
                for (AiRecommendRequest.ChatMessage h : chatHistory.subList(from, chatHistory.size())) {
                    historyStr.append(h.getRole() == null ? "user" : h.getRole())
                            .append(": ").append(h.getContent() == null ? "" : h.getContent()).append("\n");
                }
            }

            String prompt = """
당신은 버스킹 플랫폼의 지능형 시맨틱 검색 분석 에이전트입니다.
현재 시스템 기준일은 %s 입니다.

[이전 대화 기록]
%s

[실제 시스템에 존재하는 지역 목록]
%s

[사용자 최신 요청]
"%s"

[추출 지침]
1. has_region: 사용자가 특정 지역/구/동/역(예: 노원구, 서현역, 강남 등)을 명시했는지 여부 (true/false)
2. has_time: 사용자가 '퇴근길', '저녁', '밤' 같은 시간대 표현을 명시했는지 여부 (true/false)
3. matched_text: 사용자가 입력한 핵심 지역 명칭 (예: "노원구", "서현역" 등, 없으면 null)
4. time_start: '퇴근', '저녁', '밤' 등이 명시된 경우에만 "18:00:00" (없으면 null)
5. genre: 사용자가 언급한 음악 장르(예: 어쿠스틱, 재즈, 힙합, 발라드 등, 없으면 null)
6. artist_name: 사용자가 언급한 아티스트명 (없으면 null)
7. target_date: '내일', '이번 주말' 등 특정 날짜 힌트가 있다면 YYYY-MM-DD 또는 관련 키워드, 없으면 null

반드시 아래 JSON 형식으로만 응답하세요.
{
  "has_region": true또는false,
  "has_time": true또는false,
  "matched_text": "지역명 또는 null",
  "time_start": "HH:MM:SS 또는 null",
  "genre": "장르명 또는 null",
  "artist_name": "아티스트명 또는 null",
  "target_date": "날짜 또는 null"
}
""".formatted(currentDateStr, historyStr.toString(), regionsStr, userQuery);

            String rawJson = callGroq(prompt, 0.1);
            return objectMapper.readValue(rawJson, QueryAnalysis.class);
        } catch (Exception e) {
            log.warn("[Query Analysis Warning] {}", e.getMessage());
            return QueryAnalysis.empty();
        }
    }

    // =========================================================
    // 3단계: 동적 SQL 조회 (agent.py의 fetch_performances_from_db)
    // =========================================================
    private DbFetchResult fetchPerformancesFromDb(String userQuery, List<AiRecommendRequest.ChatMessage> chatHistory) {
        try {
            List<String> distinctRegions = getDistinctRegions();
            QueryAnalysis analysis = analyzeQueryWithLlm(userQuery, chatHistory, distinctRegions);
            log.info("[LLM Deep Analysis]: {}", analysis);

            boolean hasRegion = analysis.isHasRegion();
            boolean hasTime = analysis.isHasTime();
            String matchedText = analysis.getMatchedText();
            String timeStart = analysis.getTimeStart();
            String genre = analysis.getGenre();
            String artistName = analysis.getArtistName();

            List<Object> params = new ArrayList<>();
            String currentDateStr = LocalDate.now().toString();

            List<String> whereClauses = new ArrayList<>();
            whereClauses.add("p.performance_date >= ?");
            params.add(currentDateStr);

            boolean isPureTimeSearch = hasTime && !hasRegion && (matchedText == null || matchedText.isBlank());
            if (isPureTimeSearch) {
                whereClauses.add("p.start_time >= ?");
                params.add(timeStart != null ? timeStart : "18:00:00");
            }

            String targetLocation = (matchedText != null && !matchedText.isBlank()) ? matchedText : userQuery;
            boolean regionKeywordHit = REGION_HINT_KEYWORDS.stream().anyMatch(userQuery::contains);

            List<String> conditions = new ArrayList<>();
            if (hasRegion || regionKeywordHit) {
                conditions.add("(p.region ILIKE ? OR p.location_name ILIKE ? OR p.title ILIKE ? OR p.description ILIKE ?)");
                String wLoc = "%" + targetLocation + "%";
                params.add(wLoc);
                params.add(wLoc);
                params.add(wLoc);
                params.add(wLoc);
            }

            if (genre != null && !genre.isBlank()) {
                conditions.add("p.genre ILIKE ?");
                params.add("%" + genre + "%");
            }

            if (artistName != null && !artistName.isBlank()) {
                conditions.add("p.stage_name ILIKE ?");
                params.add("%" + artistName + "%");
            }

            if (!conditions.isEmpty()) {
                whereClauses.add("(" + String.join(" OR ", conditions) + ")");
            }

            String whereStr = String.join(" AND ", whereClauses);

            String orderClause = "p.performance_date ASC, p.start_time ASC";
            List<Object> orderParams = new ArrayList<>();
            if (hasRegion || (matchedText != null && !matchedText.isBlank())) {
                orderClause = "CASE WHEN p.region ILIKE ? OR p.location_name ILIKE ? THEN 0 ELSE 1 END ASC, p.performance_date ASC, p.start_time ASC";
                String wOrd = "%" + targetLocation + "%";
                orderParams.add(wOrd);
                orderParams.add(wOrd);
            }

            List<Object> allParams = new ArrayList<>(params);
            allParams.addAll(orderParams);

            String query = """
                SELECT
                    p.id, p.artist_id, p.title, p.stage_name, p.performance_date, p.start_time,
                    p.region, p.genre, p.location_name, p.description,
                    u.profile_image AS profile_image,
                    COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
                    COUNT(r.id) AS review_count,
                    COALESCE(STRING_AGG(r.comment, ' || '), '관객 리뷰가 아직 없습니다.') AS review_comments
                FROM performances p
                LEFT JOIN users u ON p.artist_id = u.id OR p.user_id = u.id
                LEFT JOIN reviews r ON p.id = r.performance_id
                WHERE %s
                GROUP BY p.id, p.artist_id, p.title, p.stage_name, p.performance_date, p.start_time, p.region, p.genre, p.location_name, p.description, u.profile_image
                ORDER BY %s
                LIMIT 40
                """.formatted(whereStr, orderClause);

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(query, allParams.toArray());

            boolean isFallback = false;
            if (rows.isEmpty()) {
                isFallback = true;
                String fallbackQuery = """
                    SELECT
                        p.id, p.artist_id, p.title, p.stage_name, p.performance_date, p.start_time,
                        p.region, p.genre, p.location_name, p.description,
                        u.profile_image AS profile_image,
                        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
                        COUNT(r.id) AS review_count,
                        COALESCE(STRING_AGG(r.comment, ' || '), '관객 리뷰가 아직 없습니다.') AS review_comments
                    FROM performances p
                    LEFT JOIN users u ON p.artist_id = u.id OR p.user_id = u.id
                    LEFT JOIN reviews r ON p.id = r.performance_id
                    WHERE p.performance_date >= ?
                    GROUP BY p.id, p.artist_id, p.title, p.stage_name, p.performance_date, p.start_time, p.region, p.genre, p.location_name, p.description, u.profile_image
                    ORDER BY p.performance_date ASC, p.start_time ASC
                    LIMIT 20
                    """;
                rows = jdbcTemplate.queryForList(fallbackQuery, currentDateStr);
            }

            StringBuilder dataStr = new StringBuilder();
            for (Map<String, Object> r : rows) {
                dataStr.append("- [공연ID: ").append(r.get("id")).append("] 공연명: ").append(r.get("title"))
                        .append(" | 아티스트: ").append(r.get("stage_name"))
                        .append(" | 일시: ").append(r.get("performance_date")).append(" ").append(r.get("start_time"))
                        .append(" | 지역: ").append(r.get("region"))
                        .append(" | 장르: ").append(r.get("genre"))
                        .append(" | 장소: ").append(r.get("location_name"))
                        .append(" | 평점: ").append(r.get("avg_rating")).append("점(").append(r.get("review_count")).append("개)")
                        .append(" | 관객 리뷰: [").append(r.get("review_comments")).append("]\n");
            }

            return new DbFetchResult(dataStr.toString(), rows, isFallback, analysis);
        } catch (Exception e) {
            log.error("[DB ERROR] {}", e.getMessage(), e);
            return new DbFetchResult("", List.of(), true, QueryAnalysis.empty());
        }
    }

    // =========================================================
    // 4단계: 후보 중 추천 선별 (agent.py의 recommend_node)
    // =========================================================
    private AiRecommendResponse buildRecommendation(String query, DbFetchResult fetched) {
        String noticeInstruction = fetched.isFallback
                ? "요청하신 조건에 일치하는 다가오는 공연을 찾지 못해, 전체 예정된 무대 중에서 골라보았어요! 🎶"
                : "요청하신 조건에 일치하는 다가오는 라이브 버스킹 무대를 모아보았어요! 🎶";

        try {
            String analysisJson = objectMapper.writeValueAsString(fetched.analysis);

            String prompt = """
당신은 버스킹 플랫폼 'BuskerSpot'의 최고 큐레이터 AI입니다.
[분석된 사용자 의도]: %s
아래 제공된 [후보 공연 목록] 중에서 사용자의 [사용자 요청]에 가장 부합하는 무대를 최대 3개 선별하세요.

[큐레이션 및 답변 작성 원칙]
1. 사용자가 특정 지역이나 장르, 아티스트를 검색했다면 해당 조건에 부합하는 공연을 최우선으로 선정하세요.
2. 반드시 [후보 공연 목록]에 실제로 존재하는 공연 ID(performance_id)만을 선택하세요.

[후보 공연 목록]
%s

[사용자 요청]
%s

[출력 JSON 양식]
{
  "report": "%s",
  "recommendations": [
    {
      "performance_id": 공연ID(숫자),
      "review_quote": "관객 리뷰를 바탕으로 한 생생한 한줄평",
      "ai_reason": "추천 이유를 설명하는 2~3줄 텍스트"
    }
  ]
}
""".formatted(analysisJson, fetched.dbData, query, noticeInstruction);

            String rawJson = callGroq(prompt, 0.2);
            JsonNode parsed = objectMapper.readTree(rawJson);

            String reportText = parsed.hasNonNull("report") ? parsed.get("report").asText() : noticeInstruction;

            Map<String, Map<String, Object>> dbMap = new HashMap<>();
            for (Map<String, Object> r : fetched.dbRows) {
                dbMap.put(String.valueOf(r.get("id")), r);
            }

            List<Map<String, Object>> finalRecs = new ArrayList<>();
            JsonNode recsNode = parsed.get("recommendations");
            if (recsNode != null && recsNode.isArray()) {
                for (JsonNode rec : recsNode) {
                    String pId = rec.hasNonNull("performance_id") ? String.valueOf(rec.get("performance_id").asLong()) : "";
                    if (dbMap.containsKey(pId)) {
                        Map<String, Object> perfInfo = new LinkedHashMap<>(dbMap.get(pId));
                        perfInfo.put("aiReviewQuote", rec.hasNonNull("review_quote") ? rec.get("review_quote").asText() : "만족도가 높은 멋진 무대입니다.");
                        perfInfo.put("aiReasonText", rec.hasNonNull("ai_reason") ? rec.get("ai_reason").asText() : "요청하신 조건에 부합하는 라이브 무대입니다.");
                        finalRecs.add(perfInfo);
                    }
                }
            }

            if (finalRecs.isEmpty() && !fetched.dbRows.isEmpty()) {
                for (Map<String, Object> r : fetched.dbRows.subList(0, Math.min(3, fetched.dbRows.size()))) {
                    Map<String, Object> perfInfo = new LinkedHashMap<>(r);
                    perfInfo.put("aiReviewQuote", "관객 호응도가 높은 추천 무대입니다.");
                    perfInfo.put("aiReasonText", "요청하신 조건과 연관된 추천 공연입니다.");
                    finalRecs.add(perfInfo);
                }
            }

            return new AiRecommendResponse(reportText, finalRecs);
        } catch (Exception e) {
            log.error("[AGENT ERROR] {}", e.getMessage(), e);

            List<Map<String, Object>> fallbackRecs = new ArrayList<>();
            for (Map<String, Object> r : fetched.dbRows.subList(0, Math.min(3, fetched.dbRows.size()))) {
                Map<String, Object> perfInfo = new LinkedHashMap<>(r);
                perfInfo.put("aiReviewQuote", "만족도가 높은 추천 무대입니다.");
                perfInfo.put("aiReasonText", "요청하신 조건에 어울리는 버스킹 공연입니다.");
                fallbackRecs.add(perfInfo);
            }

            return new AiRecommendResponse(
                    "'" + query + "' 조건에 맞춰 선별한 라이브 버스킹 추천 정보입니다.",
                    fallbackRecs
            );
        }
    }

    // =========================================================
    // Groq Chat Completions 호출 (langchain_groq.ChatGroq 대체)
    // =========================================================
    private String callGroq(String prompt, double temperature) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", MODEL);
        body.put("temperature", temperature);
        body.put("response_format", Map.of("type", "json_object"));
        body.put("messages", List.of(Map.of("role", "user", "content", prompt)));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(GROQ_URL, entity, String.class);

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            String content = root.path("choices").get(0).path("message").path("content").asText();
            return stripCodeFence(content);
        } catch (Exception e) {
            throw new RuntimeException("Groq 응답 파싱 실패: " + e.getMessage(), e);
        }
    }

    /** LLM이 ```json ... ``` 코드펜스로 감싸서 응답하는 경우를 대비 (agent.py와 동일한 처리) */
    private String stripCodeFence(String raw) {
        String text = raw.trim();
        if (text.contains("```json")) {
            return text.split("```json")[1].split("```")[0].trim();
        } else if (text.contains("```")) {
            String[] parts = text.split("```");
            if (parts.length > 1) {
                return parts[1].trim();
            }
        }
        return text;
    }

    // =========================================================
    // 내부 결과 홀더
    // =========================================================
    private static class DbFetchResult {
        final String dbData;
        final List<Map<String, Object>> dbRows;
        final boolean isFallback;
        final QueryAnalysis analysis;

        DbFetchResult(String dbData, List<Map<String, Object>> dbRows, boolean isFallback, QueryAnalysis analysis) {
            this.dbData = dbData;
            this.dbRows = dbRows;
            this.isFallback = isFallback;
            this.analysis = analysis;
        }
    }
}
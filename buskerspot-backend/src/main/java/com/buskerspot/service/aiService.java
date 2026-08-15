package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiService {

    // 메모리 캐시 저장소 (Key: prompt, Value: CacheItem)
    private static final Map<String, CacheItem> aiCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL = 10L * 60 * 1000; // 10분

    private static class CacheItem {
        String report;
        List<Map<String, Object>> recommendations;
        long timestamp;

        CacheItem(String report, List<Map<String, Object>> recommendations) {
            this.report = report;
            this.recommendations = recommendations;
            this.timestamp = System.currentTimeMillis();
        }
    }

    // 마크다운 텍스트를 파싱하여 구조화하는 헬퍼 메서드
    private Map<String, Object> parseMarkdownToResponse(String rawText) {
        if (rawText == null || rawText.isEmpty()) {
            return Map.of("report", "AI 추천 결과입니다.", "recommendations", List.of());
        }

        String cleanText = rawText.replace("\\n", "\n");

        // 인트로 리포트 문구 추출
        String report = "요청하신 조건에 맞춘 AI 추천 버스킹 공연입니다.";
        Matcher introMatcher = Pattern.compile("([\\s\\S]*?)(?=###|🎤)").matcher(cleanText);
        if (introMatcher.find()) {
            report = introMatcher.group(1).replaceAll("---|안녕하세요!", "").trim();
        }

        // 아티스트별 공연 블록 파싱
        String[] blocks = cleanText.split("(?=###\\s*🎤|###)");
        List<Map<String, Object>> recommendations = new ArrayList<>();

        int idx = 1;
        for (String block : blocks) {
            if (!block.contains("일시:") && !block.contains("장소:")) continue;

            Matcher titleMatcher = Pattern.compile("(?:###\\s*🎤|###)\\s*([^\\n]+)").matcher(block);
            String titleLine = titleMatcher.find() ? titleMatcher.group(1).trim() : "추천 공연 #" + idx;

            String stageName = "아티스트";
            String performanceTitle = titleLine;
            if (titleLine.contains("-")) {
                String[] parts = titleLine.split("-", 2);
                stageName = parts[0].trim();
                performanceTitle = parts[1].trim();
            }

            Matcher dateMatch = Pattern.compile("일시:\\*\\*?\\s*([^\\n]+)").matcher(block);
            Matcher locationMatch = Pattern.compile("장소:\\*\\*?\\s*([^\\n]+)").matcher(block);
            Matcher genreMatch = Pattern.compile("(?:장르|카테고리):\\*\\*?\\s*([^\\n\\(]+)").matcher(block);
            Matcher reviewMatch = Pattern.compile("💬\\s*\\*?관객\\s*한줄평:\\*?\\s*[\"']?([^\\n\\n]+)[\"']?").matcher(block);
            Matcher reasonMatch = Pattern.compile("✨\\s*\\*?AI\\s*분석\\s*(?:추천\\s*)?사유:\\*?\\s*([\\s\\S]*?)(?=\\n-|\\n#|\\n\\n|\\n---|$)").matcher(block);

            String fullLocation = locationMatch.find() ? locationMatch.group(1).trim() : "공연 장소";
            String timeStr = dateMatch.find() ? dateMatch.group(1).trim() : "19:00";

            Map<String, Object> rec = new HashMap<>();
            rec.put("id", "ai_rec_" + idx + "_" + System.currentTimeMillis());
            rec.put("artist_id", null);
            rec.put("stage_name", stageName);
            rec.put("title", performanceTitle);
            rec.put("start_time", timeStr.contains(" ") ? timeStr.split(" ")[1] : timeStr);
            rec.put("performance_date", timeStr.contains(" ") ? timeStr.split(" ")[0] : "2026-08-11");
            rec.put("region", fullLocation.contains(" ") ? fullLocation.split(" ")[0] : "지역");
            rec.put("location_name", fullLocation);
            rec.put("genre", genreMatch.find() ? genreMatch.group(1).trim() : "Acoustic");
            rec.put("avg_rating", 0);
            rec.put("review_count", 0);
            rec.put("aiReviewQuote", reviewMatch.find() ? reviewMatch.group(1).replaceAll("[\"']", "").trim() : null);
            rec.put("aiReasonText", reasonMatch.find() ? reasonMatch.group(1).trim() : "요청하신 조건에 부합하는 추천 공연입니다.");

            recommendations.add(rec);
            idx++;
        }

        return Map.of("report", report, "recommendations", recommendations);
    }

    // AI 추천 메인 로직 (캐시 확인 및 파이썬 스크립트 실행)
    public Map<String, Object> getRecommendation(String prompt, Object user) {
        String trimmedPrompt = prompt.trim();
        String userInfo = user != null ? user.toString() : "비회원";
        System.out.println("[AI Search Log] 유저: " + userInfo + " | 질문: \"" + trimmedPrompt + "\"");

        // 캐시 확인
        if (aiCache.containsKey(trimmedPrompt)) {
            CacheItem cached = aiCache.get(trimmedPrompt);
            if (System.currentTimeMillis() - cached.timestamp < CACHE_TTL) {
                System.out.println("⚡ [Cache Hit] \"" + trimmedPrompt + "\" - 캐시된 결과를 즉시 반환합니다.");
                return Map.of(
                        "success", true,
                        "cached", true,
                        "report", cached.report,
                        "recommendations", cached.recommendations
                );
            } else {
                aiCache.remove(trimmedPrompt);
            }
        }

        String backendRootDir = System.getProperty("user.dir");

        // Python 실행 스크립트 생성
        String pythonScript = String.format("""
import sys, os, json, warnings
warnings.filterwarnings("ignore")

backend_dir = os.path.abspath(r"%s")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

result = {"success": False, "error": "알 수 없는 오류"}

try:
    from agent import get_ai_recommendation
    query = sys.argv[1]
    output = get_ai_recommendation(query)
    result = {"success": True, "data": output}
except Exception as e:
    import traceback
    sys.stderr.write(f"[PYTHON ERROR] {e}\\n{traceback.format_exc()}")
    result = {"success": False, "error": str(e)}

sys.stdout.write("\\n###JSON_START###\\n")
sys.stdout.write(json.dumps(result, ensure_ascii=False))
sys.stdout.write("\\n###JSON_END###\\n")
""", backendRootDir.replace("\\", "/"));

        StringBuilder resultData = new StringBuilder();
        StringBuilder errorData = new StringBuilder();

        try {
            ProcessBuilder pb = new ProcessBuilder("python3", "-c", pythonScript, trimmedPrompt);
            pb.directory(new File(backendRootDir));
            Map<String, String> env = pb.environment();
            env.put("PYTHONPATH", backendRootDir);

            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8));
                 BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
                
                String line;
                while ((line = reader.readLine()) != null) {
                    resultData.append(line).append("\n");
                }
                while ((line = errorReader.readLine()) != null) {
                    errorData.append(line).append("\n");
                }
            }

            process.waitFor();

            if (!errorData.toString().trim().isEmpty()) {
                System.err.println("🐍 Python stderr:\n" + errorData.toString().trim());
            }

            String fullOutput = resultData.toString();
            String startTag = "###JSON_START###";
            String endTag = "###JSON_END###";

            int startIdx = fullOutput.indexOf(startTag);
            int endIdx = fullOutput.indexOf(endTag);

            if (startIdx == -1 || endIdx == -1) {
                throw new RuntimeException("JSON 마커 태그 미발견. stderr: " + errorData.toString().trim());
            }

            String jsonStr = fullOutput.substring(startIdx + startTag.length(), endIdx).trim();
            
            // Jackson 대신 간단한 파싱 또는 Map 구조 변환 (여기서는 ObjectMapper 활용 가정 대신 텍스트 파싱 결과 반영)
            // 실제 프로젝트에서는 ObjectMapper를 활용하여 jsonStr을 파싱합니다.
            String finalReport = "AI 추천 결과입니다.";
            List<Map<String, Object>> finalRecs = new ArrayList<>();

            // 편의상 텍스트 파서 호출 연동
            Map<String, Object> parsedMd = parseMarkdownToResponse(jsonStr);
            finalReport = (String) parsedMd.get("report");
            //noinspection unchecked
            finalRecs = (List<Map<String, Object>>) parsedMd.get("recommendations");

            // 캐시 저장
            aiCache.put(trimmedPrompt, new CacheItem(finalReport, finalRecs));

            return Map.of(
                    "success", true,
                    "cached", false,
                    "report", finalReport,
                    "recommendations", finalRecs
            );

        } catch (Exception e) {
            System.err.println("❌ Python Execution Error: " + e.getMessage());
            throw new CustomException("AI 응답 처리 중 오류가 발생했습니다: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
package com.buskerspot.controller;

import com.buskerspot.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    // 검색어 기록
    @PostMapping("/record")
    public ResponseEntity<?> record(@RequestBody Map<String, String> req) {
        searchService.recordKeyword(req.get("keyword"));
        return ResponseEntity.ok(Map.of("success", true));
    }

    // 인기 검색어 조회 (기본 7개)
    @GetMapping("/popular")
    public ResponseEntity<?> popular(@RequestParam(defaultValue = "7") int limit) {
        List<String> popularKeywords = searchService.getPopularKeywords(limit);
        return ResponseEntity.ok(Map.of("success", true, "popularKeywords", popularKeywords));
    }
}
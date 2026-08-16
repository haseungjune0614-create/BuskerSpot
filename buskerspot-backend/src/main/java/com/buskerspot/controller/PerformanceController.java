package com.buskerspot.controller;

import com.buskerspot.config.JwtTokenProvider;
import com.buskerspot.service.PerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/performances")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceService performanceService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getUserId(String authHeader) {
        return jwtTokenProvider.getId(authHeader.replace("Bearer ", ""));
    }

    @GetMapping
    public ResponseEntity<?> getAllPerformances(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(Map.of("success", true, "performances", performanceService.getPerformances(params)));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestHeader("Authorization") String auth, @RequestBody Map<String, Object> req) {
        return ResponseEntity.status(201).body(performanceService.createPerformance(getUserId(auth), req));
    }

    // 💡 [해결] /{id}보다 위에 배치하여 'my-bookmarks'가 id로 매핑되는 충돌을 방지합니다.
    @GetMapping("/my-bookmarks")
    public ResponseEntity<?> getMyBookmarks(@RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(Map.of("success", true, "performances", performanceService.getMyBookmarks(getUserId(auth))));
    }

    // 💡 [신규] 공연 찜하기 / 찜 취소 토글
    @PostMapping("/{id}/bookmark")
    public ResponseEntity<?> toggleBookmark(@PathVariable Long id, @RequestHeader("Authorization") String auth) {
        Long userId = getUserId(auth);
        return ResponseEntity.ok(performanceService.toggleBookmark(userId, id));
    }

    // 💡 내가 등록한 공연 목록 조회 — /{id}보다 위에 배치해야 함
@GetMapping("/my-performances")
public ResponseEntity<?> getMyPerformances(@RequestHeader("Authorization") String auth) {
    Long userId = getUserId(auth);
    return ResponseEntity.ok(Map.of("success", true, "performances", performanceService.getMyPerformances(userId)));
}

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> req) {
        return ResponseEntity.ok(performanceService.updateStatus(id, req.get("status")));
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        return ResponseEntity.ok(Map.of("success", true, "performance", performanceService.updatePerformance(id, req)));
    }
}
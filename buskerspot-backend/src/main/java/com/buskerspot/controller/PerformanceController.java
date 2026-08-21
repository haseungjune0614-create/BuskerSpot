package com.buskerspot.controller;

import com.buskerspot.config.JwtTokenProvider;
import com.buskerspot.dto.BatchDeleteRequest;
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
    var performance = performanceService.createPerformance(getUserId(auth), req);
    return ResponseEntity.status(201).body(Map.of("success", true, "performance", performance));
}

    // 💡 [신규 추가] 내가 찜한(북마크한) 공연 목록 조회
    @GetMapping("/my-bookmarks")
    public ResponseEntity<?> getMyBookmarks(@RequestHeader("Authorization") String auth) {
        Long userId = getUserId(auth);
        return ResponseEntity.ok(Map.of("success", true, "performances", performanceService.getMyBookmarks(userId)));
    }

    // 💡 내가 등록한 공연 목록 조회
    @GetMapping("/my-performances")
    public ResponseEntity<?> getMyPerformances(@RequestHeader("Authorization") String auth) {
        Long userId = getUserId(auth);
        return ResponseEntity.ok(Map.of("success", true, "performances", performanceService.getMyPerformances(userId)));
    }

    // 💡 [신규] 공연 일괄 삭제 (관리자용)
    @PostMapping("/batch-delete")
    public ResponseEntity<?> batchDelete(@RequestBody BatchDeleteRequest req) {
        performanceService.batchDeletePerformances(req.getIds());
        return ResponseEntity.ok(Map.of("success", true, "message", "선택한 공연들이 삭제되었습니다."));
    }

    // 💡 공연 단건 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<?> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true, "performance", performanceService.getPerformanceDetail(id)));
    }

    // 💡 공연 찜하기 / 찜 취소 토글
    @PostMapping("/{id}/bookmark")
    public ResponseEntity<?> toggleBookmark(@PathVariable Long id, @RequestHeader("Authorization") String auth) {
        Long userId = getUserId(auth);
        return ResponseEntity.ok(performanceService.toggleBookmark(userId, id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> req) {
        return ResponseEntity.ok(performanceService.updateStatus(id, req.get("status")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        return ResponseEntity.ok(Map.of("success", true, "performance", performanceService.updatePerformance(id, req)));
    }

    // 💡 공연 단건 삭제 (관리자용)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        performanceService.deletePerformance(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "공연이 삭제되었습니다."));
    }
}
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
        return ResponseEntity.status(201).body(performanceService.createPerformance(getUserId(auth), req));
    }

    // 💡 [해결] /{id}보다 위에 배치하여 'my-bookmarks'가 id로 매핑되는 충돌을 방지합니다.
    // 💡 [신규] 공연 단건 상세 조회 (알림 상세보기 등에서 사용)
@GetMapping("/{id}")
public ResponseEntity<?> getDetail(@PathVariable Long id) {
    return ResponseEntity.ok(Map.of("success", true, "performance", performanceService.getPerformanceDetail(id)));
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

    // 💡 [신규] 공연 일괄 삭제 (관리자용) — /{id}보다 위에 배치해야 함
    @PostMapping("/batch-delete")
    public ResponseEntity<?> batchDelete(@RequestBody BatchDeleteRequest req) {
        performanceService.batchDeletePerformances(req.getIds());
        return ResponseEntity.ok(Map.of("success", true, "message", "선택한 공연들이 삭제되었습니다."));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> req) {
        return ResponseEntity.ok(performanceService.updateStatus(id, req.get("status")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        return ResponseEntity.ok(Map.of("success", true, "performance", performanceService.updatePerformance(id, req)));
    }

    // 💡 [신규] 공연 단건 삭제 (관리자용)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        performanceService.deletePerformance(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "공연이 삭제되었습니다."));
    }
}
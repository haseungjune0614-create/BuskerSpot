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

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true, "performance", performanceService.getPerformanceDetail(id)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> req) {
        return ResponseEntity.ok(performanceService.updateStatus(id, req.get("status")));
    }
}
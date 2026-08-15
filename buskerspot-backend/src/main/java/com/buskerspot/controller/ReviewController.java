package com.buskerspot.controller;

import com.buskerspot.config.JwtTokenProvider;
import com.buskerspot.dto.ReviewCreateRequest;
import com.buskerspot.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("로그인 토큰이 없거나 유효하지 않습니다.");
        }
        String token = authHeader.replace("Bearer ", "");
        return jwtTokenProvider.getId(token);
    }

    // 1. 특정 공연의 리뷰 목록 조회 (`GET /api/reviews/:performanceId`)
    @GetMapping("/{performanceId}")
    public ResponseEntity<?> getReviews(@PathVariable Long performanceId) {
        return ResponseEntity.status(200).body(reviewService.getReviewsByPerformance(performanceId));
    }

    // 2. 리뷰 등록 (`POST /api/reviews`)
    @PostMapping
    public ResponseEntity<?> createReview(@RequestHeader("Authorization") String authHeader,
                                          @RequestBody ReviewCreateRequest request) {
        Long userId = getUserIdFromToken(authHeader);
        reviewService.createReview(userId, request);
        return ResponseEntity.status(201).body(Map.of("success", true, "message", "리뷰가 성공적으로 등록되었습니다."));
    }
}
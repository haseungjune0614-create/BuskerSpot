package com.buskerspot.controller;

import com.buskerspot.config.JwtTokenProvider;
import com.buskerspot.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("토큰이 존재하지 않거나 형식이 올바르지 않습니다.");
        }
        String token = authHeader.replace("Bearer ", "");
        return jwtTokenProvider.getId(token);
    }

    // 내가 팔로우한 아티스트 목록 조회
    @GetMapping({"/my", "/my-follows"})
    public ResponseEntity<?> getMyFollows(@RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        return ResponseEntity.ok(followService.getMyFollows(userId));
    }

    // 내가 팔로우한 아티스트들의 공연 목록 조회
    @GetMapping("/following-performances")
    public ResponseEntity<?> getFollowingPerformances(@RequestHeader("Authorization") String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        return ResponseEntity.ok(followService.getFollowingPerformances(userId));
    }

    // 팔로우 / 언팔로우 토글 (body 또는 path 지원)
    @PostMapping("/toggle")
    public ResponseEntity<?> toggleFollow(@RequestHeader("Authorization") String authHeader,
                                          @RequestBody Map<String, Object> request) {
        Long userId = getUserIdFromToken(authHeader);

        Object artistIdObj = request.get("artistId");
        if (artistIdObj == null) artistIdObj = request.get("targetId");
        if (artistIdObj == null) artistIdObj = request.get("artist_id");

        Long targetArtistId = artistIdObj != null ? Long.valueOf(artistIdObj.toString()) : null;

        Map<String, Object> result = followService.toggleFollow(userId, targetArtistId);
        return ResponseEntity.ok(result);
    }
}
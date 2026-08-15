package com.buskerspot.controller;

import com.buskerspot.config.JwtTokenProvider;
import com.buskerspot.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getUserId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        return jwtTokenProvider.getId(token);
    }

    // 1. 내 알림 목록 조회 (`GET /api/notifications`)
    @GetMapping
    public ResponseEntity<?> getMyNotifications(@RequestHeader("Authorization") String authHeader) {
        Long userId = getUserId(authHeader);
        return ResponseEntity.ok(notificationService.getMyNotifications(userId));
    }

    // 2. 특정 알림 읽음 처리 (`PATCH /api/notifications/:id/read`)
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@RequestHeader("Authorization") String authHeader,
                                        @PathVariable Long id) {
        Long userId = getUserId(authHeader);
        Map<String, Object> result = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(result);
    }
}
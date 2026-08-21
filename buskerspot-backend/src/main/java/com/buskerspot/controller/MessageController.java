package com.buskerspot.controller;

import com.buskerspot.dto.message.MessageResponse;
import com.buskerspot.entity.User;
import com.buskerspot.repository.UserRepository;
import com.buskerspot.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final UserRepository userRepository;

    private Long resolveUserId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + authentication.getName()));
        return user.getId();
    }

    /** 내 메시지함 목록 (최신순, 페이징) */
    @GetMapping
    public ResponseEntity<Page<MessageResponse>> getMyMessages(
            Authentication authentication,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long userId = resolveUserId(authentication);
        return ResponseEntity.ok(messageService.getMyMessages(userId, pageable));
    }

    /** 읽지 않은 메시지 개수 (네비게이션 바 뱃지 등에 사용) */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        Long userId = resolveUserId(authentication);
        long count = messageService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /** 메시지 상세 조회 (동시에 읽음 처리) */
    @GetMapping("/{recipientId}")
    public ResponseEntity<MessageResponse> readMessage(
            @PathVariable Long recipientId,
            Authentication authentication
    ) {
        Long userId = resolveUserId(authentication);
        return ResponseEntity.ok(messageService.readMessage(recipientId, userId));
    }
}
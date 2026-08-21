package com.buskerspot.controller;

import com.buskerspot.dto.message.MessageSendRequest;
import com.buskerspot.entity.User;
import com.buskerspot.repository.UserRepository;
import com.buskerspot.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/messages")
@RequiredArgsConstructor
public class AdminMessageController {

    private final MessageService messageService;
    private final UserRepository userRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Void> sendMessage(
            @Valid @RequestBody MessageSendRequest request,
            Authentication authentication
    ) {
        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("관리자를 찾을 수 없습니다: " + authentication.getName()));

        messageService.sendMessage(admin.getId(), request);
        return ResponseEntity.ok().build();
    }
}
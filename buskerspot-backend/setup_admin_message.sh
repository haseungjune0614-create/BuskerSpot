#!/bin/bash
# 사용법: buskerspot-backend 폴더 안에서 실행
#   cd ~/band_bumsu/buskerspot-backend
#   bash setup_admin_message.sh
set -e

BASE="src/main/java/com/buskerspot"

mkdir -p "$BASE/entity"
mkdir -p "$BASE/dto/message"
mkdir -p "$BASE/repository"
mkdir -p "$BASE/service"
mkdir -p "$BASE/controller"

# ---------- entity/MessageTargetType.java ----------
cat > "$BASE/entity/MessageTargetType.java" << 'EOF'
package com.buskerspot.entity;

public enum MessageTargetType {
    ALL,        // 전체 사용자 공지
    INDIVIDUAL  // 특정 사용자 1명 대상
}
EOF

# ---------- entity/Message.java ----------
cat > "$BASE/entity/Message.java" << 'EOF'
package com.buskerspot.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 관리자가 발송한 메시지 원본.
 * 전체 발송(ALL)이든 개인 발송(INDIVIDUAL)이든 한 건의 Message 로 남고,
 * 실제 수신자별 읽음 상태는 {@link MessageRecipient} 에서 관리한다.
 */
@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MessageTargetType targetType;

    // 발송한 관리자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    // INDIVIDUAL 인 경우에만 값이 채워짐 (ALL 이면 null)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id")
    private User targetUser;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
EOF

# ---------- entity/MessageRecipient.java ----------
cat > "$BASE/entity/MessageRecipient.java" << 'EOF'
package com.buskerspot.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 사용자 1명이 실제로 받은 메시지 1건.
 * 전체 발송 메시지는 발송 시점에 전체 사용자 수만큼 이 레코드가 생성된다.
 * 사용자의 "메시지함"은 이 테이블을 userId 기준으로 조회하면 된다.
 */
@Entity
@Table(
    name = "message_recipients",
    uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "user_id"}),
    indexes = @Index(name = "idx_message_recipient_user", columnList = "user_id")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageRecipient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private boolean isRead = false;

    private LocalDateTime readAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public void markAsRead() {
        if (!this.isRead) {
            this.isRead = true;
            this.readAt = LocalDateTime.now();
        }
    }
}
EOF

# ---------- dto/message/MessageSendRequest.java ----------
cat > "$BASE/dto/message/MessageSendRequest.java" << 'EOF'
package com.buskerspot.dto.message;

import com.buskerspot.entity.MessageTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageSendRequest {

    @NotBlank(message = "제목을 입력해주세요.")
    private String title;

    @NotBlank(message = "내용을 입력해주세요.")
    private String content;

    @NotNull(message = "발송 대상을 선택해주세요.")
    private MessageTargetType targetType; // ALL or INDIVIDUAL

    // targetType == INDIVIDUAL 일 때만 필수
    private Long targetUserId;
}
EOF

# ---------- dto/message/MessageResponse.java ----------
cat > "$BASE/dto/message/MessageResponse.java" << 'EOF'
package com.buskerspot.dto.message;

import com.buskerspot.entity.MessageRecipient;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MessageResponse {

    private Long recipientId;   // 사용자 메시지함에서의 PK (읽음 처리 등에 사용)
    private Long messageId;
    private String title;
    private String content;
    private boolean isRead;
    private LocalDateTime createdAt;

    public static MessageResponse from(MessageRecipient recipient) {
        return MessageResponse.builder()
                .recipientId(recipient.getId())
                .messageId(recipient.getMessage().getId())
                .title(recipient.getMessage().getTitle())
                .content(recipient.getMessage().getContent())
                .isRead(recipient.isRead())
                .createdAt(recipient.getMessage().getCreatedAt())
                .build();
    }
}
EOF

# ---------- repository/MessageRepository.java ----------
cat > "$BASE/repository/MessageRepository.java" << 'EOF'
package com.buskerspot.repository;

import com.buskerspot.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {
}
EOF

# ---------- repository/MessageRecipientRepository.java ----------
cat > "$BASE/repository/MessageRecipientRepository.java" << 'EOF'
package com.buskerspot.repository;

import com.buskerspot.entity.MessageRecipient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MessageRecipientRepository extends JpaRepository<MessageRecipient, Long> {

    @Query("select mr from MessageRecipient mr " +
           "join fetch mr.message m " +
           "where mr.user.id = :userId " +
           "order by m.createdAt desc")
    Page<MessageRecipient> findMyMessages(@Param("userId") Long userId, Pageable pageable);

    Optional<MessageRecipient> findByIdAndUser_Id(Long id, Long userId);

    long countByUser_IdAndIsReadFalse(Long userId);
}
EOF

# ---------- service/MessageService.java ----------
cat > "$BASE/service/MessageService.java" << 'EOF'
package com.buskerspot.service;

import com.buskerspot.dto.message.MessageResponse;
import com.buskerspot.dto.message.MessageSendRequest;
import com.buskerspot.entity.Message;
import com.buskerspot.entity.MessageRecipient;
import com.buskerspot.entity.MessageTargetType;
import com.buskerspot.entity.User;
import com.buskerspot.repository.MessageRecipientRepository;
import com.buskerspot.repository.MessageRepository;
import com.buskerspot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MessageService {

    private final MessageRepository messageRepository;
    private final MessageRecipientRepository messageRecipientRepository;
    private final UserRepository userRepository;

    /**
     * 관리자가 메시지를 발송한다. (ALL: 전체 공지 / INDIVIDUAL: 특정 사용자)
     * TODO: adminId 가 실제 관리자(권한 ROLE_ADMIN 등)인지 검증하는 로직은
     *       프로젝트의 기존 권한 체크 방식(예: SecurityConfig 의 hasRole 설정, User.role 필드 등)에 맞춰 추가하세요.
     */
    @Transactional
    public void sendMessage(Long adminId, MessageSendRequest request) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("관리자를 찾을 수 없습니다. id=" + adminId));

        if (request.getTargetType() == MessageTargetType.ALL) {
            sendToAll(admin, request);
        } else {
            sendToOne(admin, request);
        }
    }

    private void sendToAll(User admin, MessageSendRequest request) {
        Message message = messageRepository.save(
                Message.builder()
                        .title(request.getTitle())
                        .content(request.getContent())
                        .targetType(MessageTargetType.ALL)
                        .admin(admin)
                        .build()
        );

        List<User> allUsers = userRepository.findAll();
        List<MessageRecipient> recipients = allUsers.stream()
                .map(user -> MessageRecipient.builder()
                        .message(message)
                        .user(user)
                        .isRead(false)
                        .build())
                .toList();

        messageRecipientRepository.saveAll(recipients);
    }

    private void sendToOne(User admin, MessageSendRequest request) {
        if (request.getTargetUserId() == null) {
            throw new IllegalArgumentException("개인 발송에는 targetUserId 가 필요합니다.");
        }

        User targetUser = userRepository.findById(request.getTargetUserId())
                .orElseThrow(() -> new IllegalArgumentException("대상 사용자를 찾을 수 없습니다. id=" + request.getTargetUserId()));

        Message message = messageRepository.save(
                Message.builder()
                        .title(request.getTitle())
                        .content(request.getContent())
                        .targetType(MessageTargetType.INDIVIDUAL)
                        .admin(admin)
                        .targetUser(targetUser)
                        .build()
        );

        messageRecipientRepository.save(
                MessageRecipient.builder()
                        .message(message)
                        .user(targetUser)
                        .isRead(false)
                        .build()
        );
    }

    /** 로그인한 사용자의 메시지함 목록 (최신순, 페이징) */
    public Page<MessageResponse> getMyMessages(Long userId, Pageable pageable) {
        return messageRecipientRepository.findMyMessages(userId, pageable)
                .map(MessageResponse::from);
    }

    /** 읽지 않은 메시지 개수 (뱃지 표시용) */
    public long getUnreadCount(Long userId) {
        return messageRecipientRepository.countByUser_IdAndIsReadFalse(userId);
    }

    /** 메시지 상세 조회 + 읽음 처리 */
    @Transactional
    public MessageResponse readMessage(Long recipientId, Long userId) {
        MessageRecipient recipient = messageRecipientRepository.findByIdAndUser_Id(recipientId, userId)
                .orElseThrow(() -> new IllegalArgumentException("메시지를 찾을 수 없습니다. id=" + recipientId));

        recipient.markAsRead();
        return MessageResponse.from(recipient);
    }
}
EOF

# ---------- controller/AdminMessageController.java ----------
cat > "$BASE/controller/AdminMessageController.java" << 'EOF'
package com.buskerspot.controller;

import com.buskerspot.dto.message.MessageSendRequest;
import com.buskerspot.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 관리자가 사용자에게 메시지를 발송하는 API.
 *
 * TODO: 프로젝트의 실제 권한 체크 방식에 맞춰 @PreAuthorize 어노테이션을 조정하세요.
 * TODO: 현재 로그인한 관리자 id 를 가져오는 방식은 프로젝트마다 다릅니다.
 *       기존 AdminController / UserController 에서 사용 중인 방식이 있다면 그걸로 교체하세요.
 */
@RestController
@RequestMapping("/api/admin/messages")
@RequiredArgsConstructor
public class AdminMessageController {

    private final MessageService messageService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Void> sendMessage(
            @Valid @RequestBody MessageSendRequest request,
            Authentication authentication
    ) {
        Long adminId = Long.parseLong(authentication.getName());
        messageService.sendMessage(adminId, request);
        return ResponseEntity.ok().build();
    }
}
EOF

# ---------- controller/MessageController.java ----------
cat > "$BASE/controller/MessageController.java" << 'EOF'
package com.buskerspot.controller;

import com.buskerspot.dto.message.MessageResponse;
import com.buskerspot.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 로그인한 사용자가 자신의 메시지함(관리자로부터 받은 메시지)을 조회하는 API.
 *
 * TODO: authentication.getName() 으로 userId 를 가져오는 부분은
 *       프로젝트의 실제 인증 방식에 맞춰 조정하세요.
 */
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    /** 내 메시지함 목록 (최신순, 페이징) */
    @GetMapping
    public ResponseEntity<Page<MessageResponse>> getMyMessages(
            Authentication authentication,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long userId = Long.parseLong(authentication.getName());
        return ResponseEntity.ok(messageService.getMyMessages(userId, pageable));
    }

    /** 읽지 않은 메시지 개수 (네비게이션 바 뱃지 등에 사용) */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        long count = messageService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /** 메시지 상세 조회 (동시에 읽음 처리) */
    @GetMapping("/{recipientId}")
    public ResponseEntity<MessageResponse> readMessage(
            @PathVariable Long recipientId,
            Authentication authentication
    ) {
        Long userId = Long.parseLong(authentication.getName());
        return ResponseEntity.ok(messageService.readMessage(recipientId, userId));
    }
}
EOF

echo "완료: 10개 파일이 $BASE 아래에 생성되었습니다."

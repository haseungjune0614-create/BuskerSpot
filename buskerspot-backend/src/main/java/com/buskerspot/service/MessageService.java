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

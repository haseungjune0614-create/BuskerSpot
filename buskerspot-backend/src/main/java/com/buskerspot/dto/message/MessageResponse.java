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

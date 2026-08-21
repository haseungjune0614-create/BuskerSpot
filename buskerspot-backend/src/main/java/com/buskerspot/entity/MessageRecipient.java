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

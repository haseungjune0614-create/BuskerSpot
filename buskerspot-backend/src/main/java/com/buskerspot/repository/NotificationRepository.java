package com.buskerspot.repository;

import com.buskerspot.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 1. 특정 사용자의 알림 목록 조회 (최신순, createdAt 기준)
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 2. 특정 사용자의 읽지 않은 알림 개수 조회
    long countByUserIdAndIsReadFalse(Long userId);
}
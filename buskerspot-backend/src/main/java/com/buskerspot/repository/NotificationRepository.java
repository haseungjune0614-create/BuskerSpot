package com.buskerspot.repository;

import com.buskerspot.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 1. 특정 사용자의 알림 목록 조회 (최신순, createdAt 기준)
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 2. 특정 사용자의 읽지 않은 알림 개수 조회
    long countByUserIdAndIsReadFalse(Long userId);

    // 💡 [신규] 유저 삭제 시 관련 알림 정리용
    @Transactional
    void deleteByUserId(Long userId);

    @Transactional
    void deleteByArtistId(Long artistId);
}
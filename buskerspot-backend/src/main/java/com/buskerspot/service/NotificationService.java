package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import com.buskerspot.entity.Follow;
import com.buskerspot.entity.Notification;
import com.buskerspot.repository.FollowRepository;
import com.buskerspot.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final FollowRepository followRepository;

    // 💡 [변경] type, performanceId 파라미터 추가 (performanceId는 프로필 알림일 경우 null)
    @Transactional
    public void notifyFollowers(Long artistId, String message, String type, Long performanceId) {
        List<Follow> followers = followRepository.findByFollowingId(artistId);
        for (Follow follow : followers) {
            Notification notification = Notification.builder()
                    .userId(follow.getFollowerId())
                    .artistId(artistId)
                    .performanceId(performanceId)
                    .type(type)
                    .message(message)
                    .build();
            notificationRepository.save(notification);
        }
    }

    // 1. 내 알림 목록 조회 (최신순)
    public Map<String, Object> getMyNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return Map.of(
                "success", true,
                "notifications", notifications
        );
    }

    // 2. 특정 알림 읽음 처리
    @Transactional
    public Map<String, Object> markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException("알림을 찾을 수 없거나 권한이 없습니다.", HttpStatus.NOT_FOUND));

        if (!notification.getUserId().equals(userId)) {
            throw new CustomException("알림을 찾을 수 없거나 권한이 없습니다.", HttpStatus.FORBIDDEN);
        }

        notification.setRead(true);
        notificationRepository.save(notification);

        return Map.of("success", true, "message", "알림이 읽음 처리되었습니다.");
    }
}
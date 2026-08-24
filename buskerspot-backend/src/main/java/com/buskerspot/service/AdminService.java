package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import com.buskerspot.entity.Performance;
import com.buskerspot.entity.User;
import com.buskerspot.repository.BookmarkRepository;
import com.buskerspot.repository.FollowRepository;
import com.buskerspot.repository.MessageRecipientRepository;
import com.buskerspot.repository.NotificationRepository;
import com.buskerspot.repository.PerformanceRepository;
import com.buskerspot.repository.ReviewRepository;
import com.buskerspot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PerformanceRepository performanceRepository;
    private final MessageRecipientRepository messageRecipientRepository;
    private final FollowRepository followRepository;
    private final BookmarkRepository bookmarkRepository;
    private final NotificationRepository notificationRepository;
    private final ReviewRepository reviewRepository;

    // 1. 전체 사용자 목록 조회 (관리자용)
    public List<User> getAllUsers(Long adminUserId) {
        validateAdmin(adminUserId);
        return userRepository.findAll();
    }

    // 2. 사용자 삭제/탈퇴 처리 (관리자용)
    @Transactional
    public void deleteUser(Long adminUserId, Long targetUserId) {
        validateAdmin(adminUserId);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new CustomException("존재하지 않는 사용자입니다.", HttpStatus.NOT_FOUND));

        // 이 유저를 참조하는 연관 데이터를 먼저 정리
        messageRecipientRepository.deleteByUser_Id(targetUserId);

        // 💡 [추가] 이 유저가 팔로우했거나, 이 유저를 팔로우한 기록 정리
        followRepository.deleteByFollowerId(targetUserId);
        followRepository.deleteByFollowingId(targetUserId);

        // 💡 [추가] 이 유저의 찜(북마크) 정리
        bookmarkRepository.deleteByUserId(targetUserId);

        // 💡 [추가] 이 유저가 받은 알림 + 이 유저가 아티스트로서 발생시킨 알림 정리
        notificationRepository.deleteByUserId(targetUserId);
        notificationRepository.deleteByArtistId(targetUserId);

        // 💡 [추가] 이 유저가 작성한 리뷰 정리
        reviewRepository.deleteByUserId(targetUserId);

        userRepository.delete(targetUser);
    }

    // 3. 승인 대기 중인 공연 목록 조회 (관리자용)
    public List<Performance> getPendingPerformances(Long adminUserId) {
        validateAdmin(adminUserId);
        return performanceRepository.findByApprovalStatusOrderByIdDesc("PENDING");
    }

    // 4. 공연 승인 또는 거절 상태 변경 (관리자용)
    @Transactional
    public Performance updatePerformanceApproval(Long adminUserId, Long performanceId, String approvalStatus) {
        validateAdmin(adminUserId);
        Performance performance = performanceRepository.findById(performanceId)
                .orElseThrow(() -> new CustomException("존재하지 않는 공연입니다.", HttpStatus.NOT_FOUND));

        performance.setApprovalStatus(approvalStatus);
        return performanceRepository.save(performance);
    }

    // 5. [신규] 사용자 권한 변경 (관리자용)
    @Transactional
    public User updateUserRole(Long targetUserId, String role) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        user.setRole(role);
        return userRepository.save(user);
    }

    // 6. 관리자 권한 검증 헬퍼 메서드
    private void validateAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        if (!"ADMIN".equals(user.getRole())) {
            throw new CustomException("관리자 권한이 없습니다.", HttpStatus.FORBIDDEN);
        }
    }
}
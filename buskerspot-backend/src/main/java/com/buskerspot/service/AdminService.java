package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import com.buskerspot.entity.Performance;
import com.buskerspot.entity.User;
import com.buskerspot.repository.PerformanceRepository;
import com.buskerspot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PerformanceRepository performanceRepository;

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

        performance.setApprovalStatus(approvalStatus); // 예: 'APPROVED', 'REJECTED'
        return performanceRepository.save(performance);
    }

    // 5. 관리자 권한 검증 헬퍼 메서드
    private void validateAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        if (!"ADMIN".equals(user.getRole())) {
            throw new CustomException("관리자 권한이 없습니다.", HttpStatus.FORBIDDEN);
        }
    }
}
package com.buskerspot.repository;

import com.buskerspot.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 1. 특정 공연에 작성된 리뷰 목록 조회 (최신순)
    List<Review> findByPerformanceIdOrderByIdDesc(Long performanceId);

    // 2. 특정 사용자가 특정 공연에 이미 리뷰를 작성했는지 중복 검사
    boolean existsByUserIdAndPerformanceId(Long userId, Long performanceId);
}
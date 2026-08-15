package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import com.buskerspot.dto.ReviewCreateRequest;
import com.buskerspot.entity.Review;
import com.buskerspot.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final JdbcTemplate jdbcTemplate;

    // 1. 특정 공연의 리뷰 목록 조회 (`GET /api/reviews/:performanceId`)
    public List<Map<String, Object>> getReviewsByPerformance(Long performanceId) {
        String sql = """
            SELECT r.*, u.nickname AS user_name 
            FROM reviews r 
            LEFT JOIN users u ON r.user_id = u.id 
            WHERE r.performance_id = ? 
            ORDER BY r.id DESC
        """;
        return jdbcTemplate.queryForList(sql, performanceId);
    }

    // 2. 리뷰 등록 (`POST /api/reviews`)
    @Transactional
    public void createReview(Long userId, ReviewCreateRequest request) {
        Long performanceId = request.getPerformanceId();
        Integer rating = request.getRating();
        String comment = request.getComment();

        if (performanceId == null || rating == null || comment == null || comment.trim().isEmpty()) {
            throw new CustomException("필수 데이터가 누락되었습니다.", HttpStatus.BAD_REQUEST);
        }

        // 중복 리뷰 검사
        boolean exists = reviewRepository.existsByUserIdAndPerformanceId(userId, performanceId);
        if (exists) {
            throw new CustomException("이미 해당 공연에 작성한 리뷰가 존재합니다.", HttpStatus.BAD_REQUEST);
        }

        // 사용자 닉네임 조회
        String userName = "익명";
        try {
            String nameQuery = "SELECT nickname FROM users WHERE id = ?";
            userName = jdbcTemplate.queryForObject(nameQuery, String.class, userId);
            if (userName == null) userName = "익명";
        } catch (Exception ignored) {}

        // 리뷰 저장
        String insertSql = "INSERT INTO reviews (performance_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(insertSql, performanceId, userId, userName, rating, comment);

        // 공연 평균 평점 자동 업데이트
        String avgSql = """
            UPDATE performances 
            SET average_rating = (
                SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE performance_id = ?
            )
            WHERE id = ?
        """;
        jdbcTemplate.update(avgSql, performanceId, performanceId);
    }
}
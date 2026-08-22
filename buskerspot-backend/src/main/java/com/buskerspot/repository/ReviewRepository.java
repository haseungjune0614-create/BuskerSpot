package com.buskerspot.repository;

import com.buskerspot.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 1. 특정 공연에 작성된 리뷰 목록 조회 (최신순)
    List<Review> findByPerformanceIdOrderByIdDesc(Long performanceId);

    // 2. 특정 사용자가 특정 공연에 이미 리뷰를 작성했는지 중복 검사
    boolean existsByUserIdAndPerformanceId(Long userId, Long performanceId);

    // 3. [신규] 특정 아티스트(모든 공연 통합)의 평균 평점 조회
    @Query("""
        SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r
        WHERE r.performanceId IN (
            SELECT p.id FROM Performance p
            WHERE p.userId = :artistId OR p.artistId = :artistId
        )
    """)
    Double findAverageRatingByArtistId(@Param("artistId") Long artistId);

    // 4. [신규] 특정 아티스트(모든 공연 통합)의 총 리뷰 수 조회
    @Query("""
        SELECT COUNT(r) FROM Review r
        WHERE r.performanceId IN (
            SELECT p.id FROM Performance p
            WHERE p.userId = :artistId OR p.artistId = :artistId
        )
    """)
    long countByArtistId(@Param("artistId") Long artistId);
}
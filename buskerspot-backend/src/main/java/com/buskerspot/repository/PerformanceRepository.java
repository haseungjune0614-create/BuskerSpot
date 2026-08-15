package com.buskerspot.repository;

import com.buskerspot.entity.Performance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PerformanceRepository extends JpaRepository<Performance, Long> {

    // 1. 전체 공연 목록 조회 (최신 등록순)
    List<Performance> findAllByOrderByIdDesc();

    // 2. 특정 아티스트(사용자)가 등록한 공연 목록 조회
    List<Performance> findByUserIdOrderByIdDesc(Long userId);

    // 3. 지역별 또는 장르별 공연 검색
    @Query("""
        SELECT p FROM Performance p 
        WHERE (:region IS NULL OR p.region = :region) 
          AND (:genre IS NULL OR p.genre = :genre) 
        ORDER BY p.id DESC
    """)
    List<Performance> findByRegionAndGenre(@Param("region") String region, @Param("genre") String genre);

    // 4. 승인 상태별 공연 목록 조회 (관리자용, 예: 'PENDING')
    List<Performance> findByApprovalStatusOrderByIdDesc(String approvalStatus);
}
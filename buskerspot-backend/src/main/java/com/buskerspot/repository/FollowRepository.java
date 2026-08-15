package com.buskerspot.repository;

import com.buskerspot.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    // 1. 특정 팔로워와 팔로잉 관계 존재 여부 확인 (팔로우 상태 조회용)
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    // 2. 특정 팔로워와 팔로잉 관계로 엔티티 조회 (언팔로우 시 삭제용)
    Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);

    // 3. 특정 유저의 팔로워 수 조회
    long countByFollowingId(Long followingId);

    // 4. 특정 유저가 팔로잉하는 수 조회
    long countByFollowerId(Long followerId);
}
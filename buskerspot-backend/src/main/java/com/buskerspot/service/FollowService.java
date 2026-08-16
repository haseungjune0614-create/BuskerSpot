package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import com.buskerspot.entity.Follow;
import com.buskerspot.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final JdbcTemplate jdbcTemplate; // 복잡한 커스텀 쿼리 실행용

    // 1. 내가 팔로우한 아티스트 목록 조회
public Map<String, Object> getMyFollows(Long userId) {
    String sql = """
        SELECT 
            f.following_id AS artist_id, 
            u.nickname AS stage_name, 
            u.nickname, 
            u.profile_image, 
            u.introduction,
            u.instagram_url,
            COALESCE(
                (SELECT p.genre FROM performances p WHERE p.artist_id = f.following_id OR p.user_id = f.following_id LIMIT 1), 
                'ALL'
            ) AS genre,
            (SELECT COUNT(*)::int FROM follows f_all WHERE f_all.following_id = f.following_id) AS follower_count,
            COALESCE(
                (SELECT AVG(r.rating) FROM reviews r 
                 JOIN performances p ON r.performance_id = p.id 
                 WHERE p.artist_id = f.following_id), 0
            ) AS average_rating,
            COALESCE(
                (SELECT COUNT(r.id) FROM reviews r 
                 JOIN performances p ON r.performance_id = p.id 
                 WHERE p.artist_id = f.following_id), 0
            )::int AS review_count
        FROM follows f
        JOIN users u ON f.following_id = u.id 
        WHERE f.follower_id = ?
        GROUP BY f.following_id, u.id, u.nickname, u.profile_image, u.introduction, u.instagram_url
    """;

    List<Map<String, Object>> follows = jdbcTemplate.queryForList(sql, userId);
    List<Long> followedArtistIds = follows.stream()
            .map(row -> ((Number) row.get("artist_id")).longValue())
            .collect(Collectors.toList());

    return Map.of(
            "success", true,
            "follows", follows,
            "followedArtistIds", followedArtistIds
    );
}

// 2. 내가 팔로우한 아티스트들의 승인된 공연 목록 조회
public Map<String, Object> getFollowingPerformances(Long userId) {
    String sql = """
        SELECT p.*, 
               u.nickname AS organizer_name,
               u.profile_image AS artist_profile_image,
               u.instagram_url AS artist_instagram_url,
               COALESCE(u.introduction, '') AS artist_introduction,
               (SELECT COUNT(*)::int FROM follows f2 WHERE f2.following_id = u.id) AS follower_count,
               COALESCE(
                 (SELECT ROUND(AVG(r.rating)::numeric, 1) 
                  FROM reviews r 
                  JOIN performances p2 ON r.performance_id = p2.id 
                  WHERE p2.artist_id = u.id), 0
               ) AS artist_average_rating,
               COALESCE(
                 (SELECT COUNT(r.id)::int 
                  FROM reviews r 
                  JOIN performances p2 ON r.performance_id = p2.id 
                  WHERE p2.artist_id = u.id), 0
               ) AS artist_review_count
        FROM performances p
        JOIN follows f ON p.artist_id = f.following_id
        LEFT JOIN users u ON p.artist_id = u.id
        WHERE f.follower_id = ? AND p.status = 'APPROVED'
        ORDER BY p.performance_date ASC, p.start_time ASC
    """;

    List<Map<String, Object>> performances = jdbcTemplate.queryForList(sql, userId);
    return Map.of("success", true, "performances", performances);
}

    // 3. 팔로우 / 언팔로우 토글
    @Transactional
    public Map<String, Object> toggleFollow(Long userId, Long targetArtistId) {
        if (targetArtistId == null) {
            throw new CustomException("유효한 아티스트 ID가 필요합니다.", HttpStatus.BAD_REQUEST);
        }

        if (userId.equals(targetArtistId)) {
            throw new CustomException("자기 자신을 팔로우할 수 없습니다.", HttpStatus.BAD_REQUEST);
        }

        var existing = followRepository.findByUserIdAndArtistId(userId, targetArtistId);

        if (existing.isPresent()) {
            followRepository.delete(existing.get());
            return Map.of("success", true, "isFollowing", false, "isFollowed", false, "message", "팔로우 취소 성공");
        } else {
            Follow follow = new Follow();
            follow.setUserId(userId);
            follow.setArtistId(targetArtistId);
            followRepository.save(follow);
            return Map.of("success", true, "isFollowing", true, "isFollowed", true, "message", "팔로우 성공");
        }
    }
}
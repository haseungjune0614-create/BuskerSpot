package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import com.buskerspot.entity.Bookmark;
import com.buskerspot.entity.Performance;
import com.buskerspot.repository.BookmarkRepository;
import com.buskerspot.repository.PerformanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PerformanceService {

    private final PerformanceRepository performanceRepository;
    private final BookmarkRepository bookmarkRepository;
    private final JdbcTemplate jdbcTemplate;
    private final com.buskerspot.service.NotificationService notificationService;

    // 1. 공연 목록 조회 (검색, 정렬, 지역, 장르 필터링 포함)
    public List<Map<String, Object>> getPerformances(Map<String, String> params) {
        StringBuilder sql = new StringBuilder("""
            SELECT p.*, u.nickname AS artist_nickname, u.profile_image AS artist_profile_image, u.introduction AS artist_introduction,
                   COUNT(f.id)::int AS follower_count,
                   COALESCE((SELECT AVG(r.rating) FROM reviews r JOIN performances p2 ON r.performance_id = p2.id WHERE p2.artist_id = p.artist_id), 0) AS average_rating
            FROM performances p
            LEFT JOIN users u ON p.artist_id = u.id OR p.user_id = u.id
            LEFT JOIN follows f ON p.artist_id = f.following_id OR p.user_id = f.following_id
            WHERE 1=1
        """);

        if (params.get("artist_id") != null) {
            sql.append(" AND (p.artist_id = ").append(params.get("artist_id")).append(" OR p.user_id = ").append(params.get("artist_id")).append(")");
        } else {
            sql.append(" AND p.status = 'APPROVED'");
        }

        if (params.get("genre") != null && !"ALL".equals(params.get("genre"))) {
            sql.append(" AND p.genre = '").append(params.get("genre")).append("'");
        }

        sql.append(" GROUP BY p.id, u.nickname, u.profile_image, u.introduction ORDER BY p.performance_date ASC");

        return jdbcTemplate.queryForList(sql.toString());
    }

    // 2. 공연 등록 (PENDING 상태)
    @Transactional
    public Performance createPerformance(Long userId, Map<String, Object> req) {
        Performance p = new Performance();
        p.setArtistId(userId);
        p.setUserId(userId);
        p.setTitle((String) req.get("title"));
        p.setPerformanceDate(java.time.LocalDate.parse(req.get("date").toString()));
        p.setStartTime(java.time.LocalTime.parse(req.get("start_time").toString()));
        p.setLocation_name((String) req.get("location_name"));
        p.setStatus("PENDING");
        Performance saved = performanceRepository.save(p);
        notificationService.notifyFollowers(userId, "팔로우하신 아티스트가 새 공연을 등록했습니다: " + saved.getTitle());
        return saved;
    }

    // 3. 공연 상세 조회
    public Map<String, Object> getPerformanceDetail(Long id) {
        String sql = """
            SELECT p.*, u.nickname as organizer_name, u.instagram_url as artist_instagram_url
            FROM performances p
            LEFT JOIN users u ON p.artist_id = u.id OR p.user_id = u.id
            WHERE p.id = ? AND p.status = 'APPROVED'
        """;
        try {
            return jdbcTemplate.queryForMap(sql, id);
        } catch (Exception e) {
            throw new CustomException("공연 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }
    }

    // 4. 내 북마크 공연 목록 조회 (추가된 메서드)
    public List<Map<String, Object>> getMyBookmarks(Long userId) {
        String sql = """
            SELECT p.*, u.nickname AS artist_nickname, u.profile_image AS artist_profile_image
            FROM bookmarks b
            JOIN performances p ON b.target_id = p.id
            LEFT JOIN users u ON p.artist_id = u.id OR p.user_id = u.id
            WHERE b.user_id = ?
            ORDER BY p.performance_date ASC
        """;
        return jdbcTemplate.queryForList(sql, userId);
    }

    // 5. 공연 상태 변경 (승인 시 팔로워 알림)
    @Transactional
    public Performance updateStatus(Long id, String status) {
        Performance p = performanceRepository.findById(id)
                .orElseThrow(() -> new CustomException("공연 없음", HttpStatus.NOT_FOUND));

        String oldStatus = p.getStatus();
        p.setStatus(status);

        if (!"APPROVED".equals(oldStatus) && "APPROVED".equals(status)) {
            // 여기에 팔로워 알림 로직 구현
        }
        return performanceRepository.save(p);
    }

    public Performance updatePerformance(Long id, Map<String, Object> req) {
        Performance p = performanceRepository.findById(id)
                .orElseThrow(() -> new CustomException("공연 없음", HttpStatus.NOT_FOUND));

        if (req.get("title") != null) p.setTitle((String) req.get("title"));
        if (req.get("start_time") != null) p.setStartTime(java.time.LocalTime.parse(req.get("start_time").toString()));
        if (req.get("end_time") != null) p.setEndTime(java.time.LocalTime.parse(req.get("end_time").toString()));
        if (req.get("location_name") != null) p.setLocation_name((String) req.get("location_name"));
        if (req.get("region") != null) p.setRegion((String) req.get("region"));
        if (req.get("latitude") != null) p.setLat(Double.valueOf(req.get("latitude").toString()));
        if (req.get("longitude") != null) p.setLng(Double.valueOf(req.get("longitude").toString()));

        Performance saved = performanceRepository.save(p);
        notificationService.notifyFollowers(saved.getArtistId(), "팔로우하신 아티스트가 공연 정보를 수정했습니다: " + saved.getTitle());
        return saved;
    }

    // 6. [관리자용] 전체 공연 목록 조회
    public List<Performance> getAllPerformancesForAdmin() {
        return performanceRepository.findAll();
    }

    // 7. [관리자용] 지역 정보 수정
    @Transactional
    public Performance updateRegion(Long id, String region) {
        Performance p = performanceRepository.findById(id)
                .orElseThrow(() -> new CustomException("공연 없음", HttpStatus.NOT_FOUND));
        p.setRegion(region);
        return performanceRepository.save(p);
    }

    // 8. [신규] 공연 찜하기 / 찜 취소 토글
    @Transactional
    public Map<String, Object> toggleBookmark(Long userId, Long performanceId) {
        var existing = bookmarkRepository.findByUserIdAndTargetId(userId, performanceId);

        if (existing.isPresent()) {
            bookmarkRepository.delete(existing.get());
            return Map.of("success", true, "isBookmarked", false, "message", "찜 취소 성공");
        } else {
            Bookmark bookmark = new Bookmark();
            bookmark.setUserId(userId);
            bookmark.setTargetId(performanceId);
            bookmarkRepository.save(bookmark);
            return Map.of("success", true, "isBookmarked", true, "message", "찜 성공");
        }
    }
    // 9. [신규] 내가 등록한 공연 목록 조회
public List<Performance> getMyPerformances(Long userId) {
    return performanceRepository.findByUserIdOrderByIdDesc(userId);
}
}
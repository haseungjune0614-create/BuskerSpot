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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PerformanceService {

    private final PerformanceRepository performanceRepository;
    private final BookmarkRepository bookmarkRepository;
    private final JdbcTemplate jdbcTemplate;
    private final com.buskerspot.service.NotificationService notificationService;

    // 1. 공연 목록 조회 (검색, 정렬, 지역, 장르, 키워드 필터링 포함)
    public List<Map<String, Object>> getPerformances(Map<String, String> params) {
    StringBuilder sql = new StringBuilder("""
        SELECT p.*, u.nickname AS artist_nickname, u.profile_image AS artist_profile_image, u.introduction AS artist_introduction,
               COUNT(DISTINCT f.id)::int AS follower_count,
               COALESCE((SELECT AVG(r.rating) FROM reviews r JOIN performances p2 ON r.performance_id = p2.id
                         WHERE COALESCE(p2.artist_id, p2.user_id) = COALESCE(p.artist_id, p.user_id)), 0) AS average_rating,
               COALESCE((SELECT COUNT(r.id) FROM reviews r WHERE r.performance_id = p.id), 0)::int AS review_count
        FROM performances p
        LEFT JOIN users u ON p.artist_id = u.id OR p.user_id = u.id
        LEFT JOIN follows f ON p.artist_id = f.following_id OR p.user_id = f.following_id
        WHERE 1=1
    """);

    List<Object> sqlParams = new java.util.ArrayList<>();

    if (params.get("artist_id") != null) {
        sql.append(" AND (p.artist_id = ? OR p.user_id = ?)");
        Long artistId = Long.valueOf(params.get("artist_id"));
        sqlParams.add(artistId);
        sqlParams.add(artistId);
        sql.append(" AND p.status = 'APPROVED'");
    } else {
        sql.append(" AND p.status = 'APPROVED'");
    }

    if (params.get("genre") != null && !"ALL".equals(params.get("genre"))) {
        sql.append(" AND p.genre = ?");
        sqlParams.add(params.get("genre"));
    }

    // 💡 날짜 필터링 추가 — 선택한 날짜 이후(당일 포함) 공연만 조회
    if (params.get("date") != null && !params.get("date").isBlank()) {
        sql.append(" AND p.performance_date = ?");
        sqlParams.add(java.time.LocalDate.parse(params.get("date")));
    }

    String keyword = params.get("query") != null ? params.get("query") : params.get("keyword");
    if (keyword != null && !keyword.isBlank()) {
        sql.append("""
             AND (
                 p.title ILIKE ?
                 OR p.region ILIKE ?
                 OR p.location_name ILIKE ?
                 OR p.genre ILIKE ?
                 OR u.nickname ILIKE ?
             )
        """);
        String likeKeyword = "%" + keyword.trim() + "%";
        for (int i = 0; i < 5; i++) sqlParams.add(likeKeyword);
    }

    sql.append(" GROUP BY p.id, u.nickname, u.profile_image, u.introduction ORDER BY p.performance_date ASC");

    return jdbcTemplate.queryForList(sql.toString(), sqlParams.toArray());
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
    if (req.get("end_time") != null) p.setEndTime(java.time.LocalTime.parse(req.get("end_time").toString()));
    p.setLocation_name((String) req.get("location_name"));
    if (req.get("region") != null) p.setRegion((String) req.get("region"));
    if (req.get("genre") != null) p.setGenre((String) req.get("genre"));
    if (req.get("description") != null) p.setDescription((String) req.get("description"));
    if (req.get("latitude") != null) p.setLat(Double.valueOf(req.get("latitude").toString()));
    if (req.get("longitude") != null) p.setLng(Double.valueOf(req.get("longitude").toString()));
    p.setStatus("PENDING");

    return performanceRepository.save(p);
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

    // 4. 내 북마크 공연 목록 조회
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

        // APPROVED(승인) 상태로 변경될 때 팔로워들에게 알림 전송
        if (!"APPROVED".equals(oldStatus) && "APPROVED".equals(status)) {
           Long artistId = p.getArtistId() != null ? p.getArtistId() : p.getUserId();
           notificationService.notifyFollowers(
               artistId,
               "팔로우하신 아티스트가 새 공연을 등록했습니다: " + p.getTitle(),
               "PERFORMANCE_APPROVED",
               p.getId()
           );
        }
        
        return performanceRepository.save(p);
    }

    @Transactional
    public Performance updatePerformance(Long id, Map<String, Object> req) {
        Performance p = performanceRepository.findById(id)
                .orElseThrow(() -> new CustomException("공연 없음", HttpStatus.NOT_FOUND));

        List<String> modifiedFields = new ArrayList<>();

        if (req.get("title") != null) {
            String newTitle = (String) req.get("title");
            if (!newTitle.equals(p.getTitle())) {
                p.setTitle(newTitle);
                modifiedFields.add("공연 제목");
            }
        }

        if (req.get("start_time") != null || req.get("end_time") != null) {
            boolean timeChanged = false;
            if (req.get("start_time") != null) {
                java.time.LocalTime newStart = java.time.LocalTime.parse(req.get("start_time").toString());
                if (!newStart.equals(p.getStartTime())) {
                    p.setStartTime(newStart);
                    timeChanged = true;
                }
            }
            if (req.get("end_time") != null) {
                java.time.LocalTime newEnd = java.time.LocalTime.parse(req.get("end_time").toString());
                if (!newEnd.equals(p.getEndTime())) {
                    p.setEndTime(newEnd);
                    timeChanged = true;
                }
            }
            if (timeChanged) {
                modifiedFields.add("공연 시간");
            }
        }

        if (req.get("location_name") != null) {
            String newLoc = (String) req.get("location_name");
            if (!newLoc.equals(p.getLocation_name())) {
                p.setLocation_name(newLoc);
                modifiedFields.add("공연 위치");
            }
        }

        if (req.get("region") != null) {
            String newRegion = (String) req.get("region");
            if (!newRegion.equals(p.getRegion())) {
                p.setRegion(newRegion);
                modifiedFields.add("지역");
            }
        }

        if (req.get("latitude") != null || req.get("longitude") != null) {
            Double newLat = req.get("latitude") != null ? Double.valueOf(req.get("latitude").toString()) : p.getLat();
            Double newLng = req.get("longitude") != null ? Double.valueOf(req.get("longitude").toString()) : p.getLng();
            if (!Objects.equals(newLat, p.getLat()) || !Objects.equals(newLng, p.getLng())) {
                p.setLat(newLat);
                p.setLng(newLng);
                if (!modifiedFields.contains("공연 위치")) {
                    modifiedFields.add("공연 위치");
                }
            }
        }

        Performance saved = performanceRepository.save(p);

        // 승인된(APPROVED) 공연을 수정했을 때만 팔로워에게 알림 전송
        if ("APPROVED".equals(saved.getStatus())) {
            String updateDetail = modifiedFields.isEmpty() 
                ? "공연 정보" 
                : String.join(", ", modifiedFields);

            notificationService.notifyFollowers(
                saved.getArtistId() != null ? saved.getArtistId() : saved.getUserId(),
                String.format("팔로우하신 아티스트가 [%s]의 %s을(를) 수정했습니다.", saved.getTitle(), updateDetail),
                "PERFORMANCE_UPDATE",
                saved.getId()
            );
        }

        return saved;
    }

    // 6. [관리자용] 전체 공연 목록 조회
public List<Map<String, Object>> getAllPerformancesForAdmin() {
    String sql = """
        SELECT p.*, u.nickname AS stage_name
        FROM performances p
        LEFT JOIN users u ON p.artist_id = u.id OR p.user_id = u.id
        ORDER BY p.id DESC
    """;
    return jdbcTemplate.queryForList(sql);
}

    // 7. [관리자용] 지역 정보 수정
    @Transactional
    public Performance updateRegion(Long id, String region) {
        Performance p = performanceRepository.findById(id)
                .orElseThrow(() -> new CustomException("공연 없음", HttpStatus.NOT_FOUND));
        p.setRegion(region);
        return performanceRepository.save(p);
    }

    // 8. 공연 찜하기 / 찜 취소 토글
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

    public List<Map<String, Object>> getMyPerformances(Long userId) {
    String sql = """
        SELECT p.*, u.nickname AS stage_name
        FROM performances p
        LEFT JOIN users u ON p.artist_id = u.id OR p.user_id = u.id
        WHERE p.user_id = ?
        ORDER BY p.id DESC
    """;
    return jdbcTemplate.queryForList(sql, userId);
}

    // 10. [관리자용] 공연 단건 삭제
    @Transactional
    public void deletePerformance(Long id) {
        if (!performanceRepository.existsById(id)) {
            throw new CustomException("공연 없음", HttpStatus.NOT_FOUND);
        }
        performanceRepository.deleteById(id);
    }

    // 11. [관리자용] 공연 일괄 삭제
    @Transactional
    public void batchDeletePerformances(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new CustomException("삭제할 항목이 없습니다.", HttpStatus.BAD_REQUEST);
        }
        performanceRepository.deleteAllByIdInBatch(ids);
    }
}
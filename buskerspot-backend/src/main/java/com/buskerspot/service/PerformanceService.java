package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import com.buskerspot.entity.Performance;
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
    private final JdbcTemplate jdbcTemplate;

    // 1. 공연 목록 조회 (검색, 정렬, 지역, 장르 필터링 포함)
    public List<Map<String, Object>> getPerformances(Map<String, String> params) {
        StringBuilder sql = new StringBuilder("""
            SELECT p.*, u.nickname AS artist_nickname, u.profile_image AS artist_profile_image,
                   COUNT(f.id)::int AS follower_count,
                   COALESCE((SELECT AVG(r.rating) FROM reviews r JOIN performances p2 ON r.performance_id = p2.id WHERE p2.artist_id = p.artist_id), 0) AS average_rating
            FROM performances p
            LEFT JOIN users u ON p.artist_id = u.id OR p.user_id = u.id
            LEFT JOIN follows f ON p.artist_id = f.artist_id OR p.user_id = f.artist_id
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

        sql.append(" GROUP BY p.id, u.nickname, u.profile_image ORDER BY p.performance_date ASC");

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

    // 4. 공연 상태 변경 (승인 시 팔로워 알림)
    @Transactional
    public Performance updateStatus(Long id, String status) {
        Performance p = performanceRepository.findById(id)
                .orElseThrow(() -> new CustomException("공연 없음", HttpStatus.NOT_FOUND));

        String oldStatus = p.getStatus();
        p.setStatus(status);

        if (!"APPROVED".equals(oldStatus) && "APPROVED".equals(status)) {
            // 여기에 팔로워 알림 로직 (비동기 이벤트 혹은 유틸 호출) 구현
        }
        return performanceRepository.save(p);
    }

    // 5. [관리자용] 전체 공연 목록 조회
    public List<Performance> getAllPerformancesForAdmin() {
        return performanceRepository.findAll();
    }

    // 6. [관리자용] 지역 정보 수정
    @Transactional
    public Performance updateRegion(Long id, String region) {
        Performance p = performanceRepository.findById(id)
                .orElseThrow(() -> new CustomException("공연 없음", HttpStatus.NOT_FOUND));
        p.setRegion(region);
        return performanceRepository.save(p);
    }
}
package com.buskerspot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "performances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor // @Builder 어노테이션 사용을 위해 필수입니다.
@Builder            // 빌더 패턴을 사용하여 객체를 생성할 수 있게 지원합니다.
public class Performance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "location_name", nullable = false)
    private String locationName;

    @Column(name = "performance_date", nullable = false)
    private LocalDate performanceDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    private String genre;

    private String region;

    private Double lat;

    private Double lng;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "artist_id")
    private Long artistId;

    private String status; // 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'PENDING' 등

    @Column(name = "approval_status")
    private String approvalStatus; // 'PENDING', 'APPROVED', 'REJECTED' 등

    @Builder.Default
    @Column(name = "average_rating")
    private Double averageRating = 0.0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ==========================================
    // [서비스 레이어 하위 호환 및 편의 메서드]
    // ==========================================

    // artistId가 null일 경우 userId를 기본 반환
    public Long getArtistId() {
        return artistId != null ? artistId : userId;
    }

    public void setArtistId(Long artistId) {
        this.artistId = artistId;
    }

    // 서비스에서 location_name(스네이크 케이스) 호환용
    public void setLocation_name(String locationName) {
        this.locationName = locationName;
    }

    public String getLocation_name() {
        return this.locationName;
    }
}
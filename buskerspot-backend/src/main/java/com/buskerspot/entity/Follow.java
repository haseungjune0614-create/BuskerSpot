package com.buskerspot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "follows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "follower_id", nullable = false)
    private Long followerId;

    @Column(name = "following_id", nullable = false)
    private Long followingId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ==========================================
    // [서비스 레이어 하위 호환 및 편의 메서드]
    // ==========================================

    public Long getUserId() {
        return this.followerId;
    }

    public void setUserId(Long userId) {
        this.followerId = userId;
    }

    public Long getArtistId() {
        return this.followingId;
    }

    public void setArtistId(Long artistId) {
        this.followingId = artistId;
    }
}
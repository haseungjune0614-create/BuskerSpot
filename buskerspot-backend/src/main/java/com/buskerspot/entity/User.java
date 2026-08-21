package com.buskerspot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String nickname;

    @Column(nullable = false)
    private String role; // 'USER', 'ARTIST', 'ADMIN'

    private String phone;

    @Column(name = "profile_image")
    private String profileImage;

    @Column(name = "band_name")
    private String bandName;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    private String genre;

    @Column(name = "instagram_url")
    private String instagramUrl;

    @Column(name = "kakao_id")
    private String kakaoId;

    @Column(name = "google_id")   // 💡 추가
private String googleId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
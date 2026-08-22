package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import com.buskerspot.config.JwtTokenProvider;
import com.buskerspot.dto.auth.ProfileUpdateRequest;
import com.buskerspot.dto.auth.RegisterRequest;
import com.buskerspot.entity.User;
import com.buskerspot.repository.FollowRepository;
import com.buskerspot.repository.ReviewRepository;
import com.buskerspot.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import com.buskerspot.service.EmailService;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final FollowRepository followRepository;
    private final ReviewRepository reviewRepository;

    private final List<String> forbiddenWords = List.of(
        "씨발", "병신", "바보", "멍청이", "fuck", "shit", "bitch", "bastard",
        "asshole", "dick", "pussy", "slut", "whore", "cunt", "nigger", "faggot",
        "retard", "섹스", "새끼", "섹트", "창녀", "시발", "좌파", "친북", "메갈",
        "페미", "비건", "일베", "미친년", "친일파", "한녀", "보지", "자지", "꼬추"
    );

    private boolean containsForbiddenWord(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        return forbiddenWords.stream().anyMatch(lower::contains);
    }

    @Transactional
    public User register(RegisterRequest request) {
        String email = request.getEmail();
        String password = request.getPassword();
        String nickname = request.getNickname();
        String role = request.getRole() != null ? request.getRole() : "USER";
        String phone = request.getPhone();

        if (email == null || password == null || nickname == null) {
            throw new CustomException("필수 항목을 모두 입력해주세요.", HttpStatus.BAD_REQUEST);
        }

        if (containsForbiddenWord(nickname)) {
            throw new CustomException("사용할 수 없는 비속어가 포함된 닉네임입니다.", HttpStatus.BAD_REQUEST);
        }

        if (userRepository.existsByEmail(email)) {
            throw new CustomException("이미 가입된 이메일입니다.", HttpStatus.BAD_REQUEST);
        }

        if (userRepository.existsByNickname(nickname)) {
            throw new CustomException("이미 사용 중인 닉네임입니다.", HttpStatus.BAD_REQUEST);
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .nickname(nickname)
                .role(role)
                .phone(phone)
                .kakaoId(request.getKakaoId())
                .googleId(request.getGoogleId())
                .build();

        return userRepository.save(user);
    }

    public Map<String, Object> login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("이메일 또는 비밀번호가 올바르지 않습니다.", HttpStatus.BAD_REQUEST));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new CustomException("이메일 또는 비밀번호가 올바르지 않습니다.", HttpStatus.BAD_REQUEST);
        }

        String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole(), user.getNickname());

        return Map.of(
                "success", true,
                "token", token,
                "user", user
        );
    }

    public User getMyProfile(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public User updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        String newNickname = request.getNickname();
        boolean nicknameChanged = false;
        if (newNickname != null) {
            if (containsForbiddenWord(newNickname)) {
                throw new CustomException("사용할 수 없는 비속어가 포함된 닉네임입니다.", HttpStatus.BAD_REQUEST);
            }
            if (userRepository.existsByNicknameAndIdNot(newNickname, userId)) {
                throw new CustomException("이미 사용 중인 닉네임입니다.", HttpStatus.BAD_REQUEST);
            }
            if (!newNickname.equals(user.getNickname())) {
                nicknameChanged = true;
            }
            user.setNickname(newNickname);
        }

        if (request.getBandName() != null) user.setBandName(request.getBandName());
        if (request.getGenre() != null && "ARTIST".equals(user.getRole())) user.setGenre(request.getGenre());
        if (request.getIntroduction() != null) user.setIntroduction(request.getIntroduction());
        if (request.getProfileImage() != null) user.setProfileImage(request.getProfileImage());
        if (request.getInstagramUrl() != null) user.setInstagramUrl(request.getInstagramUrl());

        User saved = userRepository.save(user);
        if (nicknameChanged) {
            notificationService.notifyFollowers(
                saved.getId(),
                "팔로우하신 아티스트가 닉네임을 " + saved.getNickname() + "(으)로 변경했습니다.",
                "PROFILE_UPDATE",
                null   // 프로필 알림은 특정 공연이 없으므로 null
            );
        }
        return saved;
    }

    public List<Map<String, Object>> searchArtists(String keyword) {
        List<User> artists = userRepository.findByRoleAndKeyword("ARTIST", "%" + keyword.toLowerCase() + "%");

        return artists.stream().map(a -> {
            long followerCount = followRepository.countByFollowingId(a.getId());
            Double avgRating = reviewRepository.findAverageRatingByArtistId(a.getId());
            long reviewCount = reviewRepository.countByArtistId(a.getId());

            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", a.getId());
            map.put("nickname", a.getNickname());
            map.put("bandName", a.getBandName());
            map.put("genre", a.getGenre());
            map.put("profileImage", a.getProfileImage());
            map.put("introduction", a.getIntroduction());
            map.put("instagramUrl", a.getInstagramUrl());
            map.put("followerCount", followerCount);
            map.put("averageRating", avgRating != null ? avgRating : 0.0);
            map.put("reviewCount", reviewCount);
            return map;
        }).toList();
    }

    public User getArtistProfile(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new CustomException("아티스트를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }

    public Map<String, Object> handleKakaoLogin(String kakaoId, String nickname, String email, String profileImage) {
        return userRepository.findByKakaoId(kakaoId)
                .map(user -> {
                    String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole(), user.getNickname());
                    return Map.<String, Object>of(
                            "success", true,
                            "existingUser", true,
                            "token", token,
                            "user", user
                    );
                })
                .orElseGet(() -> {
                    Map<String, Object> kakaoData = Map.of(
                            "kakaoId", kakaoId,
                            "nickname", nickname != null ? nickname : "",
                            "email", email != null ? email : "",
                            "profileImage", profileImage != null ? profileImage : ""
                    );
                    return Map.of(
                            "success", true,
                            "existingUser", false,
                            "kakaoData", kakaoData
                    );
                });
    }

    // 💡 [추가된 임시 비밀번호 발급 메서드]
    @Transactional
    public Map<String, Object> issueTempPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("가입되지 않은 이메일입니다.", HttpStatus.BAD_REQUEST));

        String tempPassword = emailService.generateTempPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(user);

        emailService.sendTempPassword(email, tempPassword);

        return Map.of("success", true, "message", "임시 비밀번호가 이메일로 전송되었습니다.");
    }

    @Transactional
    public Map<String, Object> handleGoogleLogin(String googleId, String nickname, String email, String profileImage) {
        // 1. googleId로 먼저 조회
        Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
        if (byGoogleId.isPresent()) {
            User user = byGoogleId.get();
            String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole(), user.getNickname());
            return Map.of(
                    "success", true,
                    "existingUser", true,
                    "token", token,
                    "user", user
            );
        }

        // 2. googleId로 못 찾았지만 같은 이메일로 가입된 계정이 있으면 googleId를 연결(계정 통합)
        if (email != null && !email.isBlank()) {
            Optional<User> byEmail = userRepository.findByEmail(email);
            if (byEmail.isPresent()) {
                User user = byEmail.get();
                user.setGoogleId(googleId);
                userRepository.save(user);

                String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole(), user.getNickname());
                return Map.of(
                        "success", true,
                        "existingUser", true,
                        "token", token,
                        "user", user
                );
            }
        }

        // 3. 완전히 새로운 사용자
        Map<String, Object> googleData = Map.of(
                "googleId", googleId,
                "nickname", nickname != null ? nickname : "",
                "email", email != null ? email : "",
                "profileImage", profileImage != null ? profileImage : ""
        );
        return Map.of(
                "success", true,
                "existingUser", false,
                "googleData", googleData
        );
    }

    @Transactional
    public Map<String, Object> changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new CustomException("현재 비밀번호가 일치하지 않습니다.", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return Map.of("success", true, "message", "비밀번호가 성공적으로 변경되었습니다.");
    }
}
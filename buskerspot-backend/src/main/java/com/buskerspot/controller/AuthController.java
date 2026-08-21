package com.buskerspot.controller;

import com.buskerspot.common.util.FileUtil;
import com.buskerspot.config.JwtTokenProvider;
import com.buskerspot.dto.auth.LoginRequest;
import com.buskerspot.dto.auth.ProfileUpdateRequest;
import com.buskerspot.dto.auth.RegisterRequest;
import com.buskerspot.entity.User;
import com.buskerspot.service.UserService;
import com.buskerspot.service.EmailService;
// import 추가
import com.buskerspot.service.KakaoService;
import com.buskerspot.service.GoogleService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final FileUtil fileUtil;
    // 상단 필드에 추가
    private final KakaoService kakaoService;
    private final EmailService emailService;
    private final GoogleService googleService;

    // 회원가입
    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        User user = userService.register(request);
        return ResponseEntity.status(201).body(Map.of("success", true, "message", "회원가입이 완료되었습니다.", "user", user));
    }

    // 로그인
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Map<String, Object> result = userService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(result);
    }

    // 내 정보 조회 (/api/me)
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtTokenProvider.getId(token);
        User user = userService.getMyProfile(userId);
        return ResponseEntity.ok(user);
    }

    // 프로필 수정 (/api/profile)
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestHeader("Authorization") String authHeader,
                                           @RequestBody ProfileUpdateRequest request) {
        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtTokenProvider.getId(token);
        User updatedUser = userService.updateProfile(userId, request);
        return ResponseEntity.ok(Map.of("success", true, "message", "프로필이 성공적으로 수정되었습니다.", "user", updatedUser));
    }

    // 이미지 업로드 (/api/upload-image)
    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("image") MultipartFile file) {
        String imageUrl = fileUtil.storeFile(file);
        return ResponseEntity.ok(Map.of("success", true, "url", imageUrl));
    }

    // 아티스트 검색 (/api/search-artist)
    @GetMapping("/search-artist")
    public ResponseEntity<?> searchArtist(@RequestParam String keyword) {
        var artists = userService.searchArtists(keyword);
        if (artists.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "일치하는 아티스트나 장르를 찾을 수 없습니다."));
        }
        return ResponseEntity.ok(Map.of("success", true, "artists", artists, "artist", artists.get(0)));
    }

    // 아티스트 단건 조회 (/api/:id)
    @GetMapping("/{id}")
    public ResponseEntity<?> getArtistProfile(@PathVariable Long id) {
        User user = userService.getArtistProfile(id);
        return ResponseEntity.ok(user);
    }

    // 카카오 콜백 처리 (인가 코드 → 카카오 프로필 조회 → 프론트에 반환)
@PostMapping("/auth/kakao/callback")
public ResponseEntity<?> kakaoCallback(@RequestBody Map<String, String> req) {
    String code = req.get("code");
    if (code == null || code.isBlank()) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "인가 코드가 없습니다."));
    }
    Map<String, Object> kakaoData = kakaoService.getKakaoProfile(code);
    return ResponseEntity.ok(Map.of("success", true, "kakaoData", kakaoData));
}
@PostMapping("/auth/google/callback")
public ResponseEntity<?> googleCallback(@RequestBody Map<String, String> req) {
    String code = req.get("code");
    if (code == null || code.isBlank()) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "인가 코드가 없습니다."));
    }

    Map<String, Object> googleProfile = googleService.getGoogleProfile(code);
    String googleId = (String) googleProfile.get("googleId");
    String nickname = (String) googleProfile.get("nickname");
    String email = (String) googleProfile.get("email");
    String profileImage = (String) googleProfile.get("profileImage");

    Map<String, Object> result = userService.handleGoogleLogin(googleId, nickname, email, profileImage);
    return ResponseEntity.ok(result);
}
// 이메일 인증번호 발송
@PostMapping("/auth/send-email-code")
public ResponseEntity<?> sendEmailCode(@RequestBody Map<String, String> req) {
    String email = req.get("email");
    if (email == null || email.isBlank()) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "이메일을 입력해주세요."));
    }
    emailService.sendVerificationCode(email);
    return ResponseEntity.ok(Map.of("success", true, "message", "인증번호가 발송되었습니다."));
}

// 이메일 인증번호 검증
@PostMapping("/auth/verify-email-code")
public ResponseEntity<?> verifyEmailCode(@RequestBody Map<String, String> req) {
    String email = req.get("email");
    String code = req.get("code");
    boolean verified = emailService.verifyCode(email, code);
    if (verified) {
        return ResponseEntity.ok(Map.of("success", true, "message", "이메일 인증이 완료되었습니다."));
    }
    return ResponseEntity.badRequest().body(Map.of("success", false, "message", "인증번호가 올바르지 않거나 만료되었습니다."));
}

// 비밀번호 찾기 (임시 비밀번호 발급)
@PostMapping("/auth/forgot-password")
public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> req) {
    String email = req.get("email");
    Map<String, Object> result = userService.issueTempPassword(email);
    return ResponseEntity.ok(result);
}
}
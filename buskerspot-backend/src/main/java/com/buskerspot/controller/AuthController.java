package com.buskerspot.controller;

import com.buskerspot.common.util.FileUtil;
import com.buskerspot.config.JwtTokenProvider;
import com.buskerspot.dto.auth.LoginRequest;
import com.buskerspot.dto.auth.ProfileUpdateRequest;
import com.buskerspot.dto.auth.RegisterRequest;
import com.buskerspot.entity.User;
import com.buskerspot.service.UserService;
import com.buskerspot.service.EmailService;
import com.buskerspot.service.KakaoService;
import com.buskerspot.service.GoogleService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final FileUtil fileUtil;
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

    @PutMapping("/auth/password")
    public ResponseEntity<?> changePassword(@RequestHeader("Authorization") String authHeader,
                                          @RequestBody Map<String, String> req) {
        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtTokenProvider.getId(token);
        Map<String, Object> result = userService.changePassword(
                userId, req.get("currentPassword"), req.get("newPassword"));
        return ResponseEntity.ok(result);
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

    // 카카오 콜백 처리
    @RequestMapping(value = "/auth/kakao/callback", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> kakaoCallback(@RequestParam(name = "code", required = false) String code,
                                         @RequestBody(required = false) Map<String, String> req) {
        if (code == null || code.isBlank()) {
            if (req != null && req.containsKey("code")) code = req.get("code");
        }
        if (code == null || code.isBlank()) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "인가 코드가 없습니다."));

        Map<String, Object> kakaoProfile = kakaoService.getKakaoProfile(code);
        Map<String, Object> result = userService.handleKakaoLogin((String)kakaoProfile.get("kakaoId"), (String)kakaoProfile.get("nickname"), (String)kakaoProfile.get("email"), (String)kakaoProfile.get("profileImage"));
        return ResponseEntity.ok(result);
    }

    // 카카오 네이티브 로그인 (앱에서 직접 호출)
    @PostMapping("/auth/kakao/native")
    public ResponseEntity<?> kakaoNativeLogin(@RequestBody Map<String, String> req) {
        try {
            String accessToken = req.get("accessToken");
            if (accessToken == null || accessToken.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("success", false, "message", "accessToken이 필요합니다."));
            }

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            headers.set("Content-type", "application/x-www-form-urlencoded;charset=utf-8");

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://kapi.kakao.com/v2/user/me", HttpMethod.GET, entity, Map.class);

            Map<String, Object> body = response.getBody();
            if (body == null) return ResponseEntity.status(401).body(Map.of("success", false, "message", "카카오 사용자 정보 조회 실패"));

            String kakaoId = String.valueOf(body.get("id"));
            Map<String, Object> kakaoAccount = (Map<String, Object>) body.get("kakao_account");
            String email = (String) kakaoAccount.get("email");
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            String nickname = profile != null ? (String) profile.get("nickname") : "카카오유저";
            String profileImage = profile != null ? (String) profile.get("thumbnail_image_url") : "";

            Map<String, Object> result = userService.handleKakaoLogin(kakaoId, nickname, email, profileImage);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "카카오 로그인 실패: " + e.getMessage()));
        }
    }

    // 구글 콜백 처리
    @RequestMapping(value = "/auth/google/callback", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> googleCallback(@RequestParam(name = "code", required = false) String code,
                                          @RequestBody(required = false) Map<String, String> req) {
        if (code == null || code.isBlank()) {
            if (req != null && req.containsKey("code")) code = req.get("code");
        }
        if (code == null || code.isBlank()) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "인가 코드가 없습니다."));

        Map<String, Object> googleProfile = googleService.getGoogleProfile(code);
        Map<String, Object> result = userService.handleGoogleLogin((String)googleProfile.get("googleId"), (String)googleProfile.get("nickname"), (String)googleProfile.get("email"), (String)googleProfile.get("profileImage"));
        return ResponseEntity.ok(result);
    }

    // 이메일 인증번호 발송
    @PostMapping("/auth/send-email-code")
    public ResponseEntity<?> sendEmailCode(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        if (email == null || email.isBlank()) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "이메일을 입력해주세요."));
        emailService.sendVerificationCode(email);
        return ResponseEntity.ok(Map.of("success", true, "message", "인증번호가 발송되었습니다."));
    }

    // 이메일 인증번호 검증
    @PostMapping("/auth/verify-email-code")
    public ResponseEntity<?> verifyEmailCode(@RequestBody Map<String, String> req) {
        boolean verified = emailService.verifyCode(req.get("email"), req.get("code"));
        return verified ? ResponseEntity.ok(Map.of("success", true, "message", "이메일 인증이 완료되었습니다.")) : ResponseEntity.badRequest().body(Map.of("success", false, "message", "인증번호가 올바르지 않거나 만료되었습니다."));
    }

    // 비밀번호 찾기
    @PostMapping("/auth/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> req) {
        return ResponseEntity.ok(userService.issueTempPassword(req.get("email")));
    }
}
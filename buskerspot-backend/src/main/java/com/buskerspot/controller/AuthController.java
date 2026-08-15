package com.buskerspot.controller;

import com.buskerspot.common.util.FileUtil;
import com.buskerspot.config.JwtTokenProvider;
import com.buskerspot.dto.auth.LoginRequest;
import com.buskerspot.dto.auth.ProfileUpdateRequest;
import com.buskerspot.dto.auth.RegisterRequest;
import com.buskerspot.entity.User;
import com.buskerspot.service.UserService;
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
}
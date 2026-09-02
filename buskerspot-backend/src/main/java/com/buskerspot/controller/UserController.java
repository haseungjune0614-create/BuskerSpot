package com.buskerspot.controller;

import com.buskerspot.common.util.FileUtil;
import com.buskerspot.config.JwtTokenProvider;
import com.buskerspot.dto.auth.ProfileUpdateRequest;
import com.buskerspot.entity.User;
import com.buskerspot.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final FileUtil fileUtil;
    private final JwtTokenProvider jwtTokenProvider;

    // 1. 현재 로그인한 유저 정보 조회
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        User user = userService.getMyProfile(userId);
        user.setPassword(null); // 비밀번호 해시값 노출 방지
        return ResponseEntity.ok(Map.of("success", true, "user", user));
    }

    // 2. 프로필 수정
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestHeader("Authorization") String token,
                                           @RequestBody ProfileUpdateRequest request) {
        Long userId = extractUserId(token);
        User updatedUser = userService.updateProfile(userId, request);
        updatedUser.setPassword(null); // 비밀번호 해시값 노출 방지
        return ResponseEntity.ok(Map.of("success", true, "user", updatedUser));
    }

    // 3. 이미지 업로드
    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("image") MultipartFile file) {
        String imageUrl = fileUtil.storeFile(file);
        return ResponseEntity.ok(Map.of("success", true, "url", imageUrl));
    }

    // 4. 아티스트 검색
    @GetMapping("/search-artist")
    public ResponseEntity<?> searchArtist(@RequestParam String keyword) {
        var artists = userService.searchArtists(keyword);
        return ResponseEntity.ok(Map.of("success", true, "artists", artists));
    }

    // 5. 아티스트 프로필 조회 (id 기반)
    @GetMapping("/{id}")
    public ResponseEntity<?> getArtistProfile(@PathVariable Long id) {
        Map<String, Object> artist = userService.getArtistProfile(id);
        return ResponseEntity.ok(Map.of("success", true, "user", artist));
    }

    // Helper 메서드: Bearer 토큰에서 userId 추출
    private Long extractUserId(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return jwtTokenProvider.getUserId(token);
    }
}
package com.buskerspot.controller;

import com.buskerspot.common.util.FileUtil;
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

    // 1. 현재 로그인한 유저 정보 조회
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@RequestHeader("Authorization") String token) {
        // JwtTokenProvider를 통해 사용자 ID를 추출하고 서비스 호출
        return ResponseEntity.ok(userService.getMyProfile(token));
    }

    // 2. 프로필 수정
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestHeader("Authorization") String token, 
                                           @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(userService.updateProfile(token, request));
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
        return ResponseEntity.ok(userService.searchArtists(keyword));
    }

    // 5. 아티스트 프로필 조회 (id 기반)
    @GetMapping("/{id}")
    public ResponseEntity<?> getArtistProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getArtistProfile(id));
    }
}
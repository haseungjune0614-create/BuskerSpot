package com.buskerspot.controller;

import com.buskerspot.config.JwtTokenProvider;
import com.buskerspot.service.AdminService;
import com.buskerspot.service.PerformanceService;
import com.buskerspot.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;      // 회원 관리 관련
    private final PerformanceService perfService; // 공연 관리 관련
    private final JwtTokenProvider jwtTokenProvider;

    // 관리자 여부 및 역할 확인은 Security Filter에서 이미 처리되었다고 가정합니다.

    // 1. [공연 관리] 전체 공연 목록 조회
    @GetMapping("/performances")
    public ResponseEntity<?> getAdminPerformances() {
        return ResponseEntity.ok(Map.of("success", true, "performances", perfService.getAllPerformancesForAdmin()));
    }

    // 2. [공연 관리] 공연 상태 변경 (APPROVED 등)
    @PatchMapping("/performances/{id}/status")
    public ResponseEntity<?> updatePerformanceStatus(@PathVariable Long id, @RequestBody Map<String, String> req) {
        return ResponseEntity.ok(perfService.updateStatus(id, req.get("status")));
    }

    // 3. [공연 관리] 공연 지역 수정
    @PatchMapping("/performances/{id}/region")
    public ResponseEntity<?> updatePerformanceRegion(@PathVariable Long id, @RequestBody Map<String, String> req) {
        return ResponseEntity.ok(perfService.updateRegion(id, req.get("region")));
    }

    // 4. [회원 관리] 전체 회원 조회
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(Map.of("success", true, "users", adminService.getAllUsers()));
    }

    // 5. [회원 관리] 회원 권한 변경
    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> req) {
        return ResponseEntity.ok(adminService.updateUserRole(id, req.get("role")));
    }

    // 6. [회원 관리] 회원 삭제
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.deleteUser(id));
    }
}
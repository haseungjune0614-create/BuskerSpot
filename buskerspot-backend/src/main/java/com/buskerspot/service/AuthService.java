package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import com.buskerspot.config.JwtTokenProvider;
import com.buskerspot.dto.auth.LoginRequest;
import com.buskerspot.dto.auth.ProfileUpdateRequest;
import com.buskerspot.dto.auth.RegisterRequest;
import com.buskerspot.entity.User;
import com.buskerspot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    // 1. 회원가입
    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException("이미 사용 중인 이메일입니다.", HttpStatus.BAD_REQUEST);
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname());
        user.setRole(request.getRole() != null ? request.getRole() : "USER");
        user.setPhone(request.getPhone());

        if (request.getKakaoData() != null) {
            user.setKakaoId(request.getKakaoData().getKakaoId());
            if (request.getKakaoData().getProfileImage() != null) {
                user.setProfileImage(request.getKakaoData().getProfileImage());
            }
        }

        return userRepository.save(user);
    }

    // 2. 로그인
    public Map<String, Object> login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("존재하지 않는 이메일입니다.", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new CustomException("비밀번호가 일치하지 않습니다.", HttpStatus.UNAUTHORIZED);
        }

        // JWT 토큰 생성 (id, email, role, nickname)
        String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole(), user.getNickname());

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "로그인 성공");
        result.put("token", token);
        result.put("user", user);
        return result;
    }

    // 3. 내 프로필 조회
    public User getMyProfile(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }

    // 4. 프로필 수정
    @Transactional
    public User updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        if (request.getNickname() != null) user.setNickname(request.getNickname());
        if (request.getProfileImage() != null) user.setProfileImage(request.getProfileImage());
        if (request.getBandName() != null) user.setBandName(request.getBandName());
        if (request.getIntroduction() != null) user.setIntroduction(request.getIntroduction());
        if (request.getGenre() != null) user.setGenre(request.getGenre());
        if (request.getInstagramUrl() != null) user.setInstagramUrl(request.getInstagramUrl());

        return userRepository.save(user);
    }

    // 5. 아티스트 검색
    public List<User> searchArtists(String keyword) {
        return userRepository.findByNicknameContainingIgnoreCaseOrGenreContainingIgnoreCase(keyword, keyword);
    }

    // 6. 아티스트 단건 조회
    public User getArtistProfile(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new CustomException("아티스트를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }
}
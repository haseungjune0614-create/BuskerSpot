package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import com.buskerspot.config.JwtTokenProvider;
import com.buskerspot.entity.User;
import com.buskerspot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    // 비속어 목록
    private final List<String> forbiddenWords = List.of(
        '씨발', '병신', '바보', '멍청이', 'fuck', 'shit', 'bitch', 'bastard', 
        'asshole', 'dick', 'pussy', 'slut', 'whore', 'cunt', 'nigger', 'faggot', 
        'retard', '섹스', '새끼', '섹트', '창녀', '시발', '좌파', '친북', '메갈', 
        '페미', '비건', '일베', '미친년', '친일파', '한녀', '보지', '자지', '꼬추'
    );

    private boolean containsForbiddenWord(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        return forbiddenWords.stream().anyMatch(lower::contains);
    }

    // 회원가입
    @Transactional
    public User register(Map<String, Object> request) {
        String email = (String) request.get("email");
        String password = (String) request.get("password");
        String nickname = (String) request.get("nickname");
        String role = (String) request.getOrDefault("role", "USER");
        String phone = (String) request.get("phone");

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
                .build();

        return userRepository.save(user);
    }

    // 로그인
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

    // 현재 내 정보 조회
    public User getMyProfile(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }

    // 프로필 수정
    @Transactional
    public User updateProfile(Long userId, Map<String, String> request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        String newNickname = request.get("nickname");
        if (newNickname != null) {
            if (containsForbiddenWord(newNickname)) {
                throw new CustomException("사용할 수 없는 비속어가 포함된 닉네임입니다.", HttpStatus.BAD_REQUEST);
            }
            if (userRepository.existsByNicknameAndIdNot(newNickname, userId)) {
                throw new CustomException("이미 사용 중인 닉네임입니다.", HttpStatus.BAD_REQUEST);
            }
            user.setNickname(newNickname);
        }

        if (request.get("band_name") != null) user.setBandName(request.get("band_name"));
        if (request.get("genre") != null && "ARTIST".equals(user.getRole())) user.setGenre(request.get("genre"));
        if (request.get("introduction") != null) user.setIntroduction(request.get("introduction"));
        if (request.get("profile_image") != null) user.setProfileImage(request.get("profile_image"));
        if (request.get("instagram_url") != null) user.setInstagramUrl(request.get("instagram_url"));

        return userRepository.save(user);
    }

    // 아티스트 검색
    public List<User> searchArtists(String keyword) {
        return userRepository.findByRoleAndKeyword("ARTIST", "%" + keyword.toLowerCase() + "%");
    }

    // 아티스트 단건 조회
    public User getArtistProfile(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new CustomException("아티스트를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }
}
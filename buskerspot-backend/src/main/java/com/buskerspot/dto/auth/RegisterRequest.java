package com.buskerspot.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    private String email;
    private String password;
    private String nickname;
    private String role; // 'USER', 'ARTIST', 'ADMIN'
    private String phone;
    private String kakaoId;
    private KakaoDataDto kakaoData;
    private String googleId;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KakaoDataDto {
        private String kakaoId;
        private String nickname;
        private String profileImage;
    }
}
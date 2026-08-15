package com.buskerspot.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    private String email;
    private String password;
    private String nickname;
    private String role; // 'USER', 'ARTIST', 'ADMIN'
    private String phone;
    private KakaoDataDto kakaoData;

    @Getter
    @Setter
    public static class KakaoDataDto {
        private String kakaoId;
        private String nickname;
        private String profileImage;
    }
}
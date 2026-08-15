package com.buskerspot.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {
    private String nickname;
    private String profileImage;
    private String bandName;
    private String introduction;
    private String genre;
    private String instagramUrl;
}
package com.buskerspot.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileUpdateRequest {
    private String nickname;
    private String profileImage;
    private String bandName;
    private String introduction;
    private String genre;
    private String instagramUrl;
}
package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class KakaoService {

    @Value("${api.kakao.rest-key}")
    private String restApiKey;

    @Value("${api.kakao.client-secret}")
    private String clientSecret;

    @Value("${api.kakao.redirect-uri}")
    private String redirectUri;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 카카오 인가 코드를 받아 액세스 토큰을 발급받고,
     * 해당 토큰으로 사용자 프로필 정보를 조회하여 반환합니다.
     */
    public Map<String, Object> getKakaoProfile(String code) {
        String accessToken = requestAccessToken(code);
        return requestUserInfo(accessToken);
    }

    private String requestAccessToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", restApiKey);
        params.add("redirect_uri", redirectUri);
        params.add("code", code);
        if (clientSecret != null && !clientSecret.isBlank()) {
            params.add("client_secret", clientSecret);
        }

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            Map<String, Object> response = restTemplate.postForObject(
                    "https://kauth.kakao.com/oauth/token", request, Map.class
            );
            if (response == null || response.get("access_token") == null) {
                throw new CustomException("카카오 액세스 토큰 발급에 실패했습니다.", HttpStatus.BAD_GATEWAY);
            }
            return (String) response.get("access_token");
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomException("카카오 인증 서버 통신 중 오류가 발생했습니다: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> requestUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            Map<String, Object> response = restTemplate.exchange(
                    "https://kapi.kakao.com/v2/user/me",
                    HttpMethod.GET,
                    request,
                    Map.class
            ).getBody();

            if (response == null) {
                throw new CustomException("카카오 사용자 정보 조회에 실패했습니다.", HttpStatus.BAD_GATEWAY);
            }

            String kakaoId = String.valueOf((Number) response.get("id"));

            Map<String, Object> kakaoAccount = (Map<String, Object>) response.getOrDefault("kakao_account", Map.of());
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.getOrDefault("profile", Map.of());

            String nickname = (String) profile.get("nickname");
            String profileImageUrl = (String) profile.get("profile_image_url");
            String email = (String) kakaoAccount.get("email");

            return Map.of(
                    "kakaoId", kakaoId,
                    "nickname", nickname != null ? nickname : "",
                    "profileImage", profileImageUrl != null ? profileImageUrl : "",
                    "email", email != null ? email : ""
            );
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomException("카카오 사용자 정보 조회 중 오류가 발생했습니다: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }
}
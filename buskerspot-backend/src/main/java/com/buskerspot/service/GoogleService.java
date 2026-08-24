package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
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

import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GoogleService {

    @Value("${api.google.client-id}")
    private String clientId;

    @Value("${api.google.client-secret}")
    private String clientSecret;

    @Value("${api.google.redirect-uri}")
    private String redirectUri;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> getGoogleProfile(String code) {
        String accessToken = requestAccessToken(code);
        return requestUserInfo(accessToken);
    }

    // 모바일 앱에서 받은 idToken을 검증하는 메소드
    public Map<String, Object> verifyIdTokenAndGetProfile(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(clientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new CustomException("유효하지 않은 구글 idToken입니다.", HttpStatus.UNAUTHORIZED);
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String nickname = (String) payload.get("name");
            String profileImage = (String) payload.get("picture");

            return Map.of(
                    "googleId", googleId,
                    "nickname", nickname != null ? nickname : "",
                    "email", email != null ? email : "",
                    "profileImage", profileImage != null ? profileImage : ""
            );
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomException("구글 idToken 검증 중 오류가 발생했습니다: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private String requestAccessToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("code", code);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            Map<String, Object> response = restTemplate.postForObject(
                    "https://oauth2.googleapis.com/token", request, Map.class
            );
            if (response == null || response.get("access_token") == null) {
                throw new CustomException("구글 액세스 토큰 발급에 실패했습니다.", HttpStatus.BAD_GATEWAY);
            }
            return (String) response.get("access_token");
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomException("구글 인증 서버 통신 중 오류가 발생했습니다: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private Map<String, Object> requestUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            Map<String, Object> response = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    HttpMethod.GET,
                    request,
                    Map.class
            ).getBody();

            if (response == null) {
                throw new CustomException("구글 사용자 정보 조회에 실패했습니다.", HttpStatus.BAD_GATEWAY);
            }

            String googleId = String.valueOf(response.get("id"));
            String nickname = (String) response.get("name");
            String email = (String) response.get("email");
            String profileImage = (String) response.get("picture");

            return Map.of(
                    "googleId", googleId,
                    "nickname", nickname != null ? nickname : "",
                    "email", email != null ? email : "",
                    "profileImage", profileImage != null ? profileImage : ""
            );
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomException("구글 사용자 정보 조회 중 오류가 발생했습니다: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }
}
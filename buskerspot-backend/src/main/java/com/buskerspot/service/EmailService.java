package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final String RESEND_URL = "https://api.resend.com/emails";
    private static final String FROM_ADDRESS = "BuskerSpot <onboarding@resend.dev>";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${api.resend.key}")
    private String resendApiKey;

    private static final long CODE_TTL_MILLIS = 5 * 60 * 1000; // 5분

    private final Map<String, CodeEntry> verificationCodes = new ConcurrentHashMap<>();
    private final Map<String, Long> verifiedEmails = new ConcurrentHashMap<>();

    private record CodeEntry(String code, long expiresAt) {}

    public void sendVerificationCode(String email) {
        String code = generateCode();
        verificationCodes.put(email, new CodeEntry(code, System.currentTimeMillis() + CODE_TTL_MILLIS));

        sendEmail(
            email,
            "[BuskerSpot] 이메일 인증번호",
            "인증번호: " + code + "\n5분 이내에 입력해주세요."
        );
    }

    public boolean verifyCode(String email, String code) {
        CodeEntry entry = verificationCodes.get(email);
        if (entry == null || System.currentTimeMillis() > entry.expiresAt()) {
            verificationCodes.remove(email);
            return false;
        }
        boolean matched = entry.code().equals(code);
        if (matched) {
            verificationCodes.remove(email);
            verifiedEmails.put(email, System.currentTimeMillis());
        }
        return matched;
    }

    public boolean isEmailVerified(String email) {
        return verifiedEmails.containsKey(email);
    }

    public void clearVerifiedEmail(String email) {
        verifiedEmails.remove(email);
    }

    public String generateTempPassword() {
        return generateCode() + "aA!";
    }

    public void sendTempPassword(String email, String tempPassword) {
        sendEmail(
            email,
            "[BuskerSpot] 임시 비밀번호 안내",
            "임시 비밀번호: " + tempPassword + "\n로그인 후 반드시 비밀번호를 변경해주세요."
        );
    }

    private void sendEmail(String to, String subject, String textBody) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        Map<String, Object> body = Map.of(
            "from", FROM_ADDRESS,
            "to", java.util.List.of(to),
            "subject", subject,
            "text", textBody
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForEntity(RESEND_URL, entity, String.class);
        } catch (Exception e) {
            log.error("[Resend 발송 실패] {}", e.getMessage(), e);
            throw new CustomException("이메일 발송에 실패했습니다: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int num = 100000 + random.nextInt(900000);
        return String.valueOf(num);
    }
}
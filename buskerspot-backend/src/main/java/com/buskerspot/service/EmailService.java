package com.buskerspot.service;

import com.buskerspot.common.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    private static final long CODE_TTL_MILLIS = 5 * 60 * 1000; // 5분

    // email -> {code, 만료시각}
    private final Map<String, CodeEntry> verificationCodes = new ConcurrentHashMap<>();
    // 인증에 성공한 이메일 표시 (register 시 최종 검증용)
    private final Map<String, Long> verifiedEmails = new ConcurrentHashMap<>();

    private record CodeEntry(String code, long expiresAt) {}

    public void sendVerificationCode(String email) {
        String code = generateCode();
        verificationCodes.put(email, new CodeEntry(code, System.currentTimeMillis() + CODE_TTL_MILLIS));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[BuskerSpot] 이메일 인증번호");
        message.setText("인증번호: " + code + "\n5분 이내에 입력해주세요.");

        try {
            mailSender.send(message);
        } catch (Exception e) {
            throw new CustomException("이메일 발송에 실패했습니다: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
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
        return generateCode() + "aA!"; // 비밀번호 정책(영문+숫자 등) 충족용 접미사
    }

    public void sendTempPassword(String email, String tempPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[BuskerSpot] 임시 비밀번호 안내");
        message.setText("임시 비밀번호: " + tempPassword + "\n로그인 후 반드시 비밀번호를 변경해주세요.");

        try {
            mailSender.send(message);
        } catch (Exception e) {
            throw new CustomException("이메일 발송에 실패했습니다: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int num = 100000 + random.nextInt(900000); // 6자리
        return String.valueOf(num);
    }
}
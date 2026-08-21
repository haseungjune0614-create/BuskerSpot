package com.buskerspot.common.exception;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. 커스텀 비즈니스 예외 처리 (CustomException 발생 시 호출)
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<Map<String, Object>> handleCustomException(CustomException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", ex.getMessage());

        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    // 2. 유효성 검증(Validation) 실패 시 처리 (Express의 400 에러 대응)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();

        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", errorMessage != null ? errorMessage : "입력값이 올바르지 않습니다.");

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // 3. JWT 만료 처리 (401 Unauthorized) — 재로그인이 필요함을 클라이언트에 알림
    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<Map<String, Object>> handleExpiredJwt(ExpiredJwtException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "로그인이 만료되었습니다. 다시 로그인해주세요.");

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    // 4. 그 외 JWT 관련 오류 (변조/형식 오류 등) 처리 (401 Unauthorized)
    @ExceptionHandler(JwtException.class)
    public ResponseEntity<Map<String, Object>> handleJwtException(JwtException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "유효하지 않은 인증 정보입니다. 다시 로그인해주세요.");

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    // 5. 정적 리소스(업로드 이미지 등)를 찾을 수 없을 때 (404 Not Found)
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResourceFound(NoResourceFoundException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "요청한 리소스를 찾을 수 없습니다.");

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // 6. 일반적인 런타임/서버 오류 처리 (Express의 500 에러 대응)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "서버 내부 오류가 발생했습니다: " + ex.getMessage());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
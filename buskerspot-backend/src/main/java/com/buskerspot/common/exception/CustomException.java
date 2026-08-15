package com.buskerspot.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class CustomException extends RuntimeException {
    
    private final HttpStatus status;

    public CustomException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST; // 기본적으로 400 에러 처리
    }

    public CustomException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
package com.buskerspot.common.util;

import com.buskerspot.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Component
public class FileUtil {

    // 업로드될 기본 디렉토리 경로 (프로젝트 루트 내 uploads 폴더)
    private final String uploadDir = System.getProperty("user.dir") + "/uploads";

    /**
     * 파일을 서버의 uploads 폴더에 저장하고 접근 가능한 URL 경로를 반환합니다.
     */
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CustomException("업로드할 파일이 없습니다.", HttpStatus.BAD_REQUEST);
        }

        try {
            // 업로드 디렉토리가 없으면 생성
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // 원본 파일 확장자 추출
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            // 고유한 파일명 생성
            String uniqueFilename = System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8) + extension;

            // 파일 저장 경로 설정 및 저장
            Path filePath = Paths.get(uploadDir, uniqueFilename);
            Files.write(filePath, file.getBytes());

            // 클라이언트에서 접근할 수 있는 상대 URL 반환 (프론트/백엔드 도메인 분리 환경 고려)
            return "/uploads/" + uniqueFilename;

        } catch (IOException e) {
            throw new CustomException("파일 저장 중 오류가 발생했습니다: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
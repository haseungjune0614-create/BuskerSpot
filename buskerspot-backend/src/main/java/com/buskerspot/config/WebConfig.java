package com.buskerspot.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 프로젝트 루트 경로의 uploads 폴더 절대 경로 추출
        String uploadPath = Paths.get(System.getProperty("user.dir"), "uploads").toUri().toString();

        // '/uploads/**'로 시작하는 요청이 오면 로컬의 uploads 폴더에서 파일을 찾아 반환
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath);
    }
}
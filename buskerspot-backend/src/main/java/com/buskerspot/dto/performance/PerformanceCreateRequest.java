package com.buskerspot.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class PerformanceCreateRequest {
    private String title;
    private String description;
    private String locationName;
    private LocalDate performanceDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String genre;
    private String region;
    private Double lat;
    private Double lng;
}
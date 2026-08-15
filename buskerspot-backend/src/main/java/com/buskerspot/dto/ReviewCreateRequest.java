package com.buskerspot.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewCreateRequest {

    @JsonProperty("performance_id")
    private Long performanceId;

    private Integer rating;
    private String comment;
}
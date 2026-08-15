package com.buskerspot.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BatchDeleteRequest {
    private List<Long> ids;
}
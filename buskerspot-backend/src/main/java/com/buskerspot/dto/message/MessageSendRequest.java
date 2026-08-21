package com.buskerspot.dto.message;

import com.buskerspot.entity.MessageTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageSendRequest {

    @NotBlank(message = "제목을 입력해주세요.")
    private String title;

    @NotBlank(message = "내용을 입력해주세요.")
    private String content;

    @NotNull(message = "발송 대상을 선택해주세요.")
    private MessageTargetType targetType; // ALL or INDIVIDUAL

    // targetType == INDIVIDUAL 일 때만 필수
    private Long targetUserId;
}

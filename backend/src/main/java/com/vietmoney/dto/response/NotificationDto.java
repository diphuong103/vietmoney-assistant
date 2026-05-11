package com.vietmoney.dto.response;

import com.vietmoney.domain.enums.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationDto {
    private Long id;
    private NotificationType type;
    private String title;
    private String body;
    /** Frontend route, e.g. "/budget", "/news", "/plans" */
    private String link;
    private boolean read;
    private LocalDateTime createdAt;
}

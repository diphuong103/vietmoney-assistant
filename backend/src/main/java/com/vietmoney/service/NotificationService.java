package com.vietmoney.service;

import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.NotificationType;
import com.vietmoney.dto.response.NotificationDto;

import java.util.List;

public interface NotificationService {

    /** Create + persist + push via WebSocket */
    void sendTo(User user, NotificationType type, String title, String body, String link);

    /** Recent 30 notifications for the current user */
    List<NotificationDto> getMyNotifications(String username);

    /** Count of unread notifications */
    long getUnreadCount(String username);

    /** Mark all unread as read */
    void markAllRead(String username);

    /** Mark a single notification as read */
    void markRead(Long id, String username);
}

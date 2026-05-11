package com.vietmoney.service.impl;

import com.vietmoney.domain.entity.Notification;
import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.NotificationType;
import com.vietmoney.dto.response.NotificationDto;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.repository.NotificationRepository;
import com.vietmoney.repository.UserRepository;
import com.vietmoney.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void sendTo(User user, NotificationType type, String title, String body, String link) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .link(link)
                .build();

        notificationRepository.save(notification);

        NotificationDto dto = toDto(notification);

        // Push real-time to WebSocket topic: /topic/notifications/{userId}
        try {
            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + user.getId(),
                    dto);
        } catch (Exception e) {
            log.warn("WebSocket push failed for userId={}: {}", user.getId(), e.getMessage());
        }
    }

    @Override
    public List<NotificationDto> getMyNotifications(String username) {
        User user = getUser(username);
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 30))
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public long getUnreadCount(String username) {
        User user = getUser(username);
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    @Override
    public void markAllRead(String username) {
        User user = getUser(username);
        notificationRepository.markAllReadByUserId(user.getId());
    }

    @Override
    public void markRead(Long id, String username) {
        User user = getUser(username);
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));
        if (!n.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    // ─── helpers ────────────────────────────────────────────────────────

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private NotificationDto toDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .link(n.getLink())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}

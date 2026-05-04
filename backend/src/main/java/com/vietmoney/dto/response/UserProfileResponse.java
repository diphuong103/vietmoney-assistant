package com.vietmoney.dto.response;

import com.vietmoney.domain.enums.Role;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String nationality;
    private String travelDestination;
    private String avatarUrl;
    private Role role;
    private LocalDateTime createdAt;
}

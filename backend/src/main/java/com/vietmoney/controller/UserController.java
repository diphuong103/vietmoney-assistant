package com.vietmoney.controller;

import com.vietmoney.domain.entity.User;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.dto.response.UserProfileResponse;
import com.vietmoney.repository.UserRepository;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMe(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.success(toProfile(user)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMe(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> updates) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (updates.containsKey("fullName"))          user.setFullName(updates.get("fullName"));
        if (updates.containsKey("nationality"))       user.setNationality(updates.get("nationality"));
        if (updates.containsKey("travelDestination")) user.setTravelDestination(updates.get("travelDestination"));
        if (updates.containsKey("avatarUrl"))         user.setAvatarUrl(updates.get("avatarUrl"));

        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", toProfile(user)));
    }

    private UserProfileResponse toProfile(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .nationality(user.getNationality())
                .travelDestination(user.getTravelDestination())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

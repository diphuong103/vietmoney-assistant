package com.vietmoney.controller;

import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.ArticleStatus;
import com.vietmoney.dto.response.*;
import com.vietmoney.repository.ArticleRepository;
import com.vietmoney.repository.ScanHistoryRepository;
import com.vietmoney.repository.UserRepository;
import com.vietmoney.service.ArticleService;
import com.vietmoney.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService            userService;
    private final ArticleService         articleService;
    private final UserRepository         userRepository;
    private final ArticleRepository      articleRepository;
    private final ScanHistoryRepository  scanHistoryRepository;

    // ── Stats ─────────────────────────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getStats() {

        AdminStatsResponse stats = AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalArticles(articleRepository.count())
                .pendingArticles(articleRepository.countByStatus(ArticleStatus.PENDING))
                .totalScansToday(scanHistoryRepository.countByScannedAtAfter(
                        LocalDate.now().atStartOfDay()))
                .build();

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<User>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<User> usersPage = userService.getAllUsers(page, size);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(usersPage)));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<Void>> updateRole(
            @PathVariable Long id,
            @RequestParam String role) {

        userService.updateUserRole(id, role);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật quyền thành công", null));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {

        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa người dùng", null));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(@PathVariable Long id) {

        userService.toggleUserStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Đã thay đổi trạng thái", null));
    }

    // ── Articles ──────────────────────────────────────────────────────────────
    // Dùng ArticleDto thay vì Article entity để tránh LazyInitializationException
    // khi Jackson serialize mediaList ngoài transaction
    @GetMapping("/articles")
    public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getArticlesByStatus(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<ArticleDto> result = articleService.getArticlesByStatus(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result)));
    }
}
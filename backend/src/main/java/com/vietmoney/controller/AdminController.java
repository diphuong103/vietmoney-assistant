package com.vietmoney.controller;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.dto.response.*;
import com.vietmoney.domain.entity.User;
import com.vietmoney.service.ArticleService;
import com.vietmoney.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final ArticleService articleService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<User>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<com.vietmoney.domain.entity.User> usersPage = userService.getAllUsers(page, size);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of((Page)usersPage)));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<Void>> updateRole(
            @PathVariable Long id, @RequestParam String role) {
        userService.updateUserRole(id, role);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật quyền thành công", null));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa người dùng", null));
    }

    @GetMapping("/articles/pending")
    public ResponseEntity<ApiResponse<PageResponse<Article>>> getPendingArticles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Article> result = articleService.getPendingArticles(page, size);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result)));
    }
}

package com.vietmoney.controller;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.dto.response.*;
import com.vietmoney.repository.UserRepository;
import com.vietmoney.service.ArticleService;
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

    private final UserRepository userRepository;
    private final ArticleService articleService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<UserProfileResponse>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Implement with mapping
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
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

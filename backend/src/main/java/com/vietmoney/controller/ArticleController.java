package com.vietmoney.controller;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.dto.request.ArticleRequest;
import com.vietmoney.dto.response.*;
import com.vietmoney.service.ArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<PageResponse<Article>>> getApproved(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Article> result = articleService.getApprovedArticles(page, size);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Article>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ArticleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Bài viết đã gửi, chờ phê duyệt",
                articleService.createArticle(userDetails.getUsername(), request)));
    }

    @PutMapping("/admin/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Article>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt thành công", articleService.approveArticle(id)));
    }

    @PutMapping("/admin/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Article>> reject(@PathVariable Long id,
            @RequestParam String reason) {
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối bài viết", articleService.rejectArticle(id, reason)));
    }
}

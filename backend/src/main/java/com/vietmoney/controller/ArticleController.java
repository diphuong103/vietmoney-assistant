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
@RequestMapping("/api/v1/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    // Public: lấy bài đã duyệt
    @GetMapping("/public")
    public ResponseEntity<ApiResponse<PageResponse<Article>>> getApproved(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Article> result = articleService.getApprovedArticles(page, size);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result)));
    }

    // Public: lấy chi tiết bài theo id
    @GetMapping("/public/{id}")
    public ResponseEntity<ApiResponse<Article>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(articleService.getArticleById(id)));
    }

    // User: lấy bài viết của chính mình
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<Article>>> getMyArticles(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Article> result = articleService.getMyArticles(userDetails.getUsername(), page, size);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result)));
    }

    // User: tạo bài viết
    @PostMapping
    public ResponseEntity<ApiResponse<Article>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ArticleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Bài viết đã gửi, chờ phê duyệt",
                articleService.createArticle(userDetails.getUsername(), request)));
    }

    // Admin: lấy danh sách theo status
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<Article>>> getByStatus(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Article> result = articleService.getArticlesByStatus(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result)));
    }

    // Admin: duyệt bài
    @PutMapping("/admin/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Article>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt thành công",
                articleService.approveArticle(id)));
    }

    // Admin: từ chối bài
    @PutMapping("/admin/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Article>> reject(
            @PathVariable Long id,
            @RequestParam String reason) {
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối bài viết",
                articleService.rejectArticle(id, reason)));
    }

    // User: like/lưu bài
    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<Void>> like(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        articleService.likeArticle(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Đã lưu vào danh sách yêu thích", null));
    }

    // Admin: xoá bài
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return ResponseEntity.ok(ApiResponse.success("Xoá bài viết thành công", null));
    }


}

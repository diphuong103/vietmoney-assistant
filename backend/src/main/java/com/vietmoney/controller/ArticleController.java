package com.vietmoney.controller;

import com.vietmoney.dto.request.ArticleRequest;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.dto.response.ArticleDto;
import com.vietmoney.dto.response.ArticleStatusResponse;
import com.vietmoney.dto.response.PageResponse;
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

    // =========================================================
    // PUBLIC FEED
    // =========================================================

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getApproved(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<ArticleDto> result = articleService.getApprovedArticles(page, size);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result)));
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<ApiResponse<ArticleDto>> getById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(articleService.getArticleById(id)));
    }

    // =========================================================
    // MY POSTS
    // =========================================================

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getMyArticles(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<ArticleDto> result;

        if (status != null && !status.isBlank()) {
            result = articleService.getMyArticlesByStatus(
                    userDetails.getUsername(), status, page, size);
        } else {
            result = articleService.getMyArticles(
                    userDetails.getUsername(), page, size);
        }

        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result)));
    }

    // =========================================================
    // CREATE
    // =========================================================

    @PostMapping
    public ResponseEntity<ApiResponse<ArticleDto>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ArticleRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Bài viết đã được tạo",
                        articleService.createArticle(userDetails.getUsername(), request)
                )
        );
    }

    // =========================================================
    // UPDATE
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ArticleDto>> update(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ArticleRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cập nhật bài viết thành công",
                        articleService.updateArticle(userDetails.getUsername(), id, request)
                )
        );
    }

    // =========================================================
    // SOFT DELETE
    // =========================================================

    @DeleteMapping("/{id}/soft")
    public ResponseEntity<ApiResponse<Void>> softDelete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        articleService.softDeleteArticle(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá bài viết", null));
    }

    // =========================================================
    // LIKE
    // =========================================================

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<ArticleStatusResponse>> like(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ArticleStatusResponse status =
                articleService.toggleLike(userDetails.getUsername(), id);

        String msg = status.isLiked() ? "Đã thích bài viết" : "Đã bỏ thích";
        return ResponseEntity.ok(ApiResponse.success(msg, status));
    }

    // =========================================================
    // SAVE
    // =========================================================

    @PostMapping("/{id}/save")
    public ResponseEntity<ApiResponse<ArticleStatusResponse>> save(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ArticleStatusResponse status =
                articleService.toggleSave(userDetails.getUsername(), id);

        String msg = status.isSaved() ? "Đã lưu bài viết" : "Đã bỏ lưu bài viết";
        return ResponseEntity.ok(ApiResponse.success(msg, status));
    }

    // =========================================================
    // ARTICLE STATUS
    // =========================================================

    @GetMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ArticleStatusResponse>> getStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Trạng thái bài viết",
                        articleService.getArticleStatus(userDetails.getUsername(), id)
                )
        );
    }

    // =========================================================
    // ADMIN
    // =========================================================

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getByStatus(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<ArticleDto> result = articleService.getArticlesByStatus(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result)));
    }

    @PutMapping("/admin/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ArticleDto>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Phê duyệt thành công", articleService.approveArticle(id))
        );
    }

    @PutMapping("/admin/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ArticleDto>> reject(
            @PathVariable Long id,
            @RequestParam String reason
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Đã từ chối bài viết", articleService.rejectArticle(id, reason))
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return ResponseEntity.ok(ApiResponse.success("Xoá bài viết thành công", null));
    }
}
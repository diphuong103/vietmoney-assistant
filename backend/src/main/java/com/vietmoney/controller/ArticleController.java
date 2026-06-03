package com.vietmoney.controller;

import com.vietmoney.dto.request.ArticleRequest;
import com.vietmoney.dto.request.CommentRequest;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/articles")
@RequiredArgsConstructor
public class ArticleController {

        private final ArticleService articleService;

        // =====================================================
        // PUBLIC FEED
        // =====================================================

        @GetMapping("/public")
        public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getPublicFeed(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                Page<ArticleDto> result = articleService.getPublicFeed(page, size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                PageResponse.of(result)));
        }

        // =====================================================
        // FOLLOWING FEED
        // =====================================================

        @GetMapping("/following")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getFollowingFeed(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                Page<ArticleDto> result = articleService.getFollowingFeed(
                                userDetails.getUsername(),
                                page,
                                size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                PageResponse.of(result)));
        }

        // =====================================================
        // ARTICLE DETAIL
        // =====================================================

        @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<ArticleDto>> getArticleById(
                        @PathVariable Long id) {

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                articleService.getArticleById(id)));
        }

        // =====================================================
        // MY ARTICLES
        // =====================================================

        @GetMapping("/my")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getMyArticles(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @RequestParam(required = false) String status,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                Page<ArticleDto> result = articleService.getMyArticles(
                                userDetails.getUsername(),
                                status,
                                page,
                                size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                PageResponse.of(result)));
        }

        // =====================================================
        // USER ARTICLES
        // =====================================================

        @GetMapping("/user/{userId}")
        public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getUserArticles(
                        @PathVariable Long userId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                Page<ArticleDto> result = articleService.getUserArticles(
                                userId,
                                page,
                                size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                PageResponse.of(result)));
        }

        // =====================================================
        // CATEGORY
        // =====================================================

        @GetMapping("/category/{category}")
        public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getByCategory(
                        @PathVariable String category,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                Page<ArticleDto> result = articleService.getByCategory(
                                category,
                                page,
                                size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                PageResponse.of(result)));
        }

        // =====================================================
        // LOCATION
        // =====================================================

        @GetMapping("/location")
        public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getByLocation(
                        @RequestParam String location,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                Page<ArticleDto> result = articleService.getByLocation(
                                location,
                                page,
                                size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                PageResponse.of(result)));
        }

        // =====================================================
        // TRENDING
        // =====================================================

        @GetMapping("/trending")
        public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getTrending(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                Page<ArticleDto> result = articleService.getTrending(
                                page,
                                size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                PageResponse.of(result)));
        }

        // =====================================================
        // FEATURED
        // =====================================================

        @GetMapping("/featured")
        public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getFeatured(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                Page<ArticleDto> result = articleService.getFeatured(
                                page,
                                size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                PageResponse.of(result)));
        }

        // =====================================================
        // SEARCH
        // =====================================================

        @GetMapping("/search")
        public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> searchArticles(
                        @RequestParam String keyword,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                Page<ArticleDto> result = articleService.searchArticles(
                                keyword,
                                page,
                                size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                PageResponse.of(result)));
        }

        // =====================================================
        // HASHTAG
        // =====================================================

        @GetMapping("/hashtag/{hashtag}")
        public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getByHashtag(
                        @PathVariable String hashtag,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                Page<ArticleDto> result = articleService.getByHashtag(
                                hashtag,
                                page,
                                size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                PageResponse.of(result)));
        }

        // =====================================================
        // RELATED ARTICLES
        // =====================================================

        @GetMapping("/{id}/related")
        public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getRelatedArticles(
                        @PathVariable Long id,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {

                Page<ArticleDto> result = articleService.getRelatedArticles(
                                id,
                                page,
                                size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                PageResponse.of(result)));
        }

        // =====================================================
        // CREATE ARTICLE
        // =====================================================

        @PostMapping
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<ApiResponse<ArticleDto>> createArticle(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @Valid @RequestBody ArticleRequest request) {

                ArticleDto result = articleService.createArticle(
                                userDetails.getUsername(),
                                request);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Tạo bài viết thành công",
                                                result));
        }

        // =====================================================
        // UPDATE ARTICLE
        // =====================================================

        @PutMapping("/{id}")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<ApiResponse<ArticleDto>> updateArticle(
                        @PathVariable Long id,
                        @AuthenticationPrincipal UserDetails userDetails,
                        @Valid @RequestBody ArticleRequest request) {

                ArticleDto result = articleService.updateArticle(
                                userDetails.getUsername(),
                                id,
                                request);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Cập nhật bài viết thành công",
                                                result));
        }

        // =====================================================
        // SOFT DELETE
        // =====================================================

        @DeleteMapping("/{id}/soft")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<ApiResponse<Void>> softDeleteArticle(
                        @PathVariable Long id,
                        @AuthenticationPrincipal UserDetails userDetails) {

                articleService.softDeleteArticle(
                                userDetails.getUsername(),
                                id);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Xóa bài viết thành công",
                                                null));
        }

        // =====================================================
        // HARD DELETE
        // =====================================================

        @DeleteMapping("/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<Void>> hardDeleteArticle(
                        @PathVariable Long id) {

                articleService.hardDeleteArticle(id);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Xóa vĩnh viễn bài viết thành công",
                                                null));
        }

        // =====================================================
        // LIKE ARTICLE
        // =====================================================

        @PostMapping("/{id}/like")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<ApiResponse<ArticleStatusResponse>> toggleLike(
                        @PathVariable Long id,
                        @AuthenticationPrincipal UserDetails userDetails) {

                ArticleStatusResponse result = articleService.toggleLike(
                                userDetails.getUsername(),
                                id);

                String message = result.isLiked()
                                ? "Đã thích bài viết"
                                : "Đã bỏ thích bài viết";

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                message,
                                                result));
        }

        // =====================================================
        // SAVE ARTICLE
        // =====================================================

        @PostMapping("/{id}/save")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<ApiResponse<ArticleStatusResponse>> toggleSave(
                        @PathVariable Long id,
                        @AuthenticationPrincipal UserDetails userDetails) {

                ArticleStatusResponse result = articleService.toggleSave(
                                userDetails.getUsername(),
                                id);

                String message = result.isSaved()
                                ? "Đã lưu bài viết"
                                : "Đã bỏ lưu bài viết";

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                message,
                                                result));
        }

        // =====================================================
        // ARTICLE STATUS
        // =====================================================

        @GetMapping("/{id}/status")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<ApiResponse<ArticleStatusResponse>> getArticleStatus(
                        @PathVariable Long id,
                        @AuthenticationPrincipal UserDetails userDetails) {

                ArticleStatusResponse result = articleService.getArticleStatus(
                                userDetails.getUsername(),
                                id);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Lấy trạng thái bài viết thành công",
                                                result));
        }

        // =====================================================
        // SAVED ARTICLES
        // =====================================================

        @GetMapping("/saved")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getSavedArticles(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                Page<ArticleDto> result = articleService.getSavedArticles(
                                userDetails.getUsername(),
                                page,
                                size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                PageResponse.from(result)));
        }

        // =====================================================
        // ADMIN - GET BY STATUS
        // =====================================================

        @GetMapping("/admin/status")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<PageResponse<ArticleDto>>> getArticlesByStatus(
                        @RequestParam String status,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                Page<ArticleDto> result = articleService.getArticlesByStatus(
                                status,
                                page,
                                size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                PageResponse.of(result)));
        }

        // =====================================================
        // COMMENTS
        // =====================================================

        @GetMapping("/{articleId}/comments")
        public ResponseEntity<ApiResponse<PageResponse<ArticleCommentDto>>> getComments(
                        @PathVariable Long articleId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                Page<ArticleCommentDto> result = articleService.getRootComments(articleId, page, size);
                return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result)));
        }

        @PostMapping("/{articleId}/comments")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<ApiResponse<ArticleCommentDto>> createComment(
                        @PathVariable Long articleId,
                        @AuthenticationPrincipal UserDetails userDetails,
                        @Valid @RequestBody CommentRequest request) {
                ArticleCommentDto result = articleService.createComment(
                                userDetails.getUsername(), articleId, request);
                return ResponseEntity.ok(ApiResponse.success("Bình luận thành công", result));
        }

        @GetMapping("/{articleId}/comments/{commentId}/replies")
        public ResponseEntity<ApiResponse<List<ArticleCommentDto>>> getReplies(
                        @PathVariable Long articleId,
                        @PathVariable Long commentId) {
                List<ArticleCommentDto> result = articleService.getReplies(articleId, commentId);
                return ResponseEntity.ok(ApiResponse.success(result));
        }

        @DeleteMapping("/{articleId}/comments/{commentId}")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<ApiResponse<Void>> deleteComment(
                        @PathVariable Long articleId,
                        @PathVariable Long commentId,
                        @AuthenticationPrincipal UserDetails userDetails) {
                articleService.deleteComment(userDetails.getUsername(), articleId, commentId);
                return ResponseEntity.ok(ApiResponse.success("Xóa bình luận thành công", null));
        }

        // =====================================================
        // ADMIN - APPROVE ARTICLE
        // =====================================================

        @PutMapping("/admin/{id}/approve")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<ArticleDto>> approveArticle(
                        @PathVariable Long id) {

                ArticleDto result = articleService.approveArticle(id);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Phê duyệt bài viết thành công",
                                                result));
        }

        // =====================================================
        // ADMIN - REJECT ARTICLE
        // =====================================================

        @PutMapping("/admin/{id}/reject")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<ArticleDto>> rejectArticle(
                        @PathVariable Long id,
                        @RequestParam String reason) {

                ArticleDto result = articleService.rejectArticle(
                                id,
                                reason);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Từ chối bài viết thành công",
                                                result));
        }

        // =====================================================
        // STATISTICS
        // =====================================================

        @GetMapping("/statistics/approved-count")
        public ResponseEntity<ApiResponse<Long>> countApprovedArticles() {

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                articleService.countApprovedArticles()));
        }

        @GetMapping("/statistics/total-count")
        public ResponseEntity<ApiResponse<Long>> countAllArticles() {

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                articleService.countAllArticles()));
        }

        @GetMapping("/statistics/my-count")
        public ResponseEntity<ApiResponse<Long>> countMyArticles(
                        @AuthenticationPrincipal UserDetails userDetails) {

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                articleService.countUserArticles(
                                                                userDetails.getUsername())));
        }
}
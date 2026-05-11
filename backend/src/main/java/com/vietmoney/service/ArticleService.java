package com.vietmoney.service;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.domain.entity.ArticleLike;
import com.vietmoney.domain.entity.ArticleMedia;
import com.vietmoney.domain.entity.SavedArticle;
import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.ArticleCategory;
import com.vietmoney.domain.enums.ArticleStatus;
import com.vietmoney.domain.enums.NotificationType;
import com.vietmoney.dto.request.ArticleRequest;
import com.vietmoney.dto.request.MediaRequest;
import com.vietmoney.dto.response.ArticleDto;
import com.vietmoney.dto.response.ArticleStatusResponse;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.repository.ArticleLikeRepository;
import com.vietmoney.repository.ArticleRepository;
import com.vietmoney.repository.SavedArticleRepository;
import com.vietmoney.repository.UserRepository;
import com.vietmoney.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArticleService {

        private final ArticleRepository articleRepository;
        private final UserRepository userRepository;
        private final SavedArticleRepository savedArticleRepository;
        private final ArticleLikeRepository articleLikeRepository;
        private final NotificationService notificationService;

        // =========================================================
        // PUBLIC FEED
        // =========================================================

        /**
         * Đọc toàn bộ article + mediaList trong cùng một transaction
         * rồi map sang DTO trước khi session đóng → tránh LazyInitializationException
         */
        @Transactional(readOnly = true)
        public Page<ArticleDto> getApprovedArticles(int page, int size) {

                Page<Article> articles = articleRepository.findByStatusAndDeletedFalse(
                                ArticleStatus.APPROVED,
                                PageRequest.of(page, size, Sort.by("createdAt").descending()));

                // Trigger lazy load mediaList trong transaction
                List<ArticleDto> dtos = articles.getContent()
                                .stream()
                                .map(a -> {
                                        // access mediaList ở đây để khởi tạo trong session
                                        a.getMediaList().size();
                                        return ArticleDto.from(a);
                                })
                                .collect(Collectors.toList());

                return new PageImpl<>(dtos, articles.getPageable(), articles.getTotalElements());
        }

        @Transactional(readOnly = true)
        public ArticleDto getArticleById(Long id) {

                Article article = articleRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_FOUND));

                if (Boolean.TRUE.equals(article.getDeleted())) {
                        throw new AppException(ErrorCode.ARTICLE_NOT_FOUND);
                }

                article.setViewCount(article.getViewCount() + 1);
                articleRepository.save(article);

                // Trigger lazy load trong transaction
                article.getMediaList().size();

                return ArticleDto.from(article);
        }

        // =========================================================
        // USER POSTS
        // =========================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> getMyArticles(String username, int page, int size) {

                User author = userRepository.findByUsername(username)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                Page<Article> articles = articleRepository.findByAuthorAndDeletedFalse(
                                author,
                                PageRequest.of(page, size, Sort.by("createdAt").descending()));

                List<ArticleDto> dtos = articles.getContent()
                                .stream()
                                .map(a -> {
                                        a.getMediaList().size();
                                        return ArticleDto.from(a);
                                })
                                .collect(Collectors.toList());

                return new PageImpl<>(dtos, articles.getPageable(), articles.getTotalElements());
        }

        @Transactional(readOnly = true)
        public Page<ArticleDto> getMyArticlesByStatus(
                        String username, String status, int page, int size) {

                User author = userRepository.findByUsername(username)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                ArticleStatus articleStatus = ArticleStatus.valueOf(status.toUpperCase());

                Page<Article> articles = articleRepository.findByAuthorAndStatusAndDeletedFalse(
                                author,
                                articleStatus,
                                PageRequest.of(page, size, Sort.by("createdAt").descending()));

                List<ArticleDto> dtos = articles.getContent()
                                .stream()
                                .map(a -> {
                                        a.getMediaList().size();
                                        return ArticleDto.from(a);
                                })
                                .collect(Collectors.toList());

                return new PageImpl<>(dtos, articles.getPageable(), articles.getTotalElements());
        }

        // =========================================================
        // CREATE POST
        // =========================================================

        @Transactional
        public ArticleDto createArticle(String username, ArticleRequest request) {

                User author = userRepository.findByUsername(username)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                Article article = Article.builder()
                                .author(author)
                                .title(request.getTitle())
                                .content(request.getContent())
                                .tags(request.getTags())
                                .category(
                                                request.getCategory() != null
                                                                ? ArticleCategory.valueOf(
                                                                                request.getCategory().toUpperCase())
                                                                : ArticleCategory.GENERAL)
                                .status(
                                                request.getStatus() != null
                                                                ? ArticleStatus.valueOf(
                                                                                request.getStatus().toUpperCase())
                                                                : ArticleStatus.PENDING)
                                .deleted(false)
                                .isEdited(false)
                                .viewCount(0L)
                                .likeCount(0L)
                                .saveCount(0L)
                                .commentCount(0L)
                                .shareCount(0L)
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build();

                Article savedArticle = articleRepository.save(article);

                if (request.getMedia() != null) {
                        for (MediaRequest mediaRequest : request.getMedia()) {
                                ArticleMedia media = ArticleMedia.builder()
                                                .article(savedArticle)
                                                .mediaUrl(mediaRequest.getMediaUrl())
                                                .mediaType(mediaRequest.getMediaType())
                                                .fileSize(mediaRequest.getFileSize())
                                                .mimeType(mediaRequest.getMimeType())
                                                .build();
                                savedArticle.getMediaList().add(media);
                        }
                }

                Article result = articleRepository.save(savedArticle);

                // Trigger lazy load trong transaction trước khi map DTO
                result.getMediaList().size();

                return ArticleDto.from(result);
        }

        // =========================================================
        // UPDATE POST
        // =========================================================

        @Transactional
        public ArticleDto updateArticle(String username, Long articleId, ArticleRequest request) {

                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                Article article = articleRepository.findById(articleId)
                                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_FOUND));

                if (!article.getAuthor().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.FORBIDDEN);
                }

                article.setTitle(request.getTitle());
                article.setContent(request.getContent());
                article.setTags(request.getTags());

                if (request.getCategory() != null) {
                        article.setCategory(
                                        ArticleCategory.valueOf(request.getCategory().toUpperCase()));
                }

                if (request.getStatus() != null) {
                        article.setStatus(
                                        ArticleStatus.valueOf(request.getStatus().toUpperCase()));
                }

                article.setIsEdited(true);
                article.setEditedAt(LocalDateTime.now());

                article.getMediaList().clear();

                if (request.getMedia() != null) {
                        for (MediaRequest mediaRequest : request.getMedia()) {
                                ArticleMedia media = ArticleMedia.builder()
                                                .article(article)
                                                .mediaUrl(mediaRequest.getMediaUrl())
                                                .mediaType(mediaRequest.getMediaType())
                                                .fileSize(mediaRequest.getFileSize())
                                                .mimeType(mediaRequest.getMimeType())
                                                .build();
                                article.getMediaList().add(media);
                        }
                }

                Article result = articleRepository.save(article);
                result.getMediaList().size();

                return ArticleDto.from(result);
        }

        // =========================================================
        // SOFT DELETE
        // =========================================================

        @Transactional
        public void softDeleteArticle(String username, Long articleId) {

                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                Article article = articleRepository.findById(articleId)
                                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_FOUND));

                if (!article.getAuthor().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.FORBIDDEN);
                }

                article.setDeleted(true);
                articleRepository.save(article);
        }

        // =========================================================
        // ADMIN
        // =========================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> getPendingArticles(int page, int size) {

                Page<Article> articles = articleRepository.findByStatusAndDeletedFalse(
                                ArticleStatus.PENDING,
                                PageRequest.of(page, size, Sort.by("createdAt").descending()));

                List<ArticleDto> dtos = articles.getContent()
                                .stream()
                                .map(a -> {
                                        a.getMediaList().size();
                                        return ArticleDto.from(a);
                                })
                                .collect(Collectors.toList());

                return new PageImpl<>(dtos, articles.getPageable(), articles.getTotalElements());
        }

        @Transactional(readOnly = true)
        public Page<ArticleDto> getArticlesByStatus(String statusStr, int page, int size) {

                if (statusStr == null || statusStr.isBlank()) {
                        return getPendingArticles(page, size);
                }

                ArticleStatus status = ArticleStatus.valueOf(statusStr.toUpperCase());

                Page<Article> articles = articleRepository.findByStatusAndDeletedFalse(
                                status,
                                PageRequest.of(page, size, Sort.by("createdAt").descending()));

                List<ArticleDto> dtos = articles.getContent()
                                .stream()
                                .map(a -> {
                                        a.getMediaList().size();
                                        return ArticleDto.from(a);
                                })
                                .collect(Collectors.toList());

                return new PageImpl<>(dtos, articles.getPageable(), articles.getTotalElements());
        }

        @Transactional
        public ArticleDto approveArticle(Long id) {

                Article article = articleRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_FOUND));

                article.setStatus(ArticleStatus.APPROVED);
                article.setPublishedAt(LocalDateTime.now());

                Article result = articleRepository.save(article);
                result.getMediaList().size();

                // Notify author
                notificationService.sendTo(
                                article.getAuthor(),
                                NotificationType.ARTICLE_APPROVED,
                                "Bài viết được duyệt!",
                                "Bài \"" + article.getTitle() + "\" đã được phê duyệt và hiển thị công khai.",
                                "/news");

                return ArticleDto.from(result);
        }

        @Transactional
        public ArticleDto rejectArticle(Long id, String reason) {

                Article article = articleRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_FOUND));

                article.setStatus(ArticleStatus.REJECTED);
                article.setRejectionReason(reason);

                Article result = articleRepository.save(article);
                result.getMediaList().size();

                // Notify author
                notificationService.sendTo(
                                article.getAuthor(),
                                NotificationType.ARTICLE_REJECTED,
                                "Bài viết bị từ chối",
                                "Bài \"" + article.getTitle() + "\" bị từ chối. Lý do: " + reason,
                                "/news");

                return ArticleDto.from(result);
        }

        @Transactional
        public void deleteArticle(Long id) {
                articleRepository.deleteById(id);
        }

        // =========================================================
        // LIKE
        // =========================================================

        @Transactional
        public ArticleStatusResponse toggleLike(String username, Long articleId) {

                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                Article article = articleRepository.findById(articleId)
                                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_FOUND));

                boolean liked;
                Optional<ArticleLike> existingLike = articleLikeRepository.findByUserAndArticle(user, article);

                if (existingLike.isPresent()) {
                        articleLikeRepository.delete(existingLike.get());
                        article.setLikeCount(Math.max(0, article.getLikeCount() - 1));
                        liked = false;
                } else {
                        ArticleLike newLike = ArticleLike.builder()
                                        .user(user)
                                        .article(article)
                                        .build();
                        articleLikeRepository.save(newLike);
                        article.setLikeCount(article.getLikeCount() + 1);
                        liked = true;
                }

                articleRepository.save(article);

                boolean saved = savedArticleRepository.existsByUserAndArticle(user, article);

                return ArticleStatusResponse.builder()
                                .liked(liked)
                                .saved(saved)
                                .likeCount(article.getLikeCount())
                                .build();
        }

        // =========================================================
        // SAVE
        // =========================================================

        @Transactional
        public ArticleStatusResponse toggleSave(String username, Long articleId) {

                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                Article article = articleRepository.findById(articleId)
                                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_FOUND));

                boolean saved;
                Optional<SavedArticle> existing = savedArticleRepository.findByUserAndArticle(user, article);

                if (existing.isPresent()) {
                        savedArticleRepository.delete(existing.get());
                        saved = false;
                } else {
                        SavedArticle savedArticle = SavedArticle.builder()
                                        .user(user)
                                        .article(article)
                                        .build();
                        savedArticleRepository.save(savedArticle);
                        saved = true;
                }

                boolean liked = articleLikeRepository
                                .findByUserAndArticle(user, article)
                                .isPresent();

                return ArticleStatusResponse.builder()
                                .liked(liked)
                                .saved(saved)
                                .likeCount(article.getLikeCount())
                                .build();
        }

        // =========================================================
        // STATUS
        // =========================================================

        @Transactional(readOnly = true)
        public ArticleStatusResponse getArticleStatus(String username, Long articleId) {

                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                Article article = articleRepository.findById(articleId)
                                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_FOUND));

                boolean liked = articleLikeRepository
                                .findByUserAndArticle(user, article)
                                .isPresent();

                boolean saved = savedArticleRepository.existsByUserAndArticle(user, article);

                return ArticleStatusResponse.builder()
                                .liked(liked)
                                .saved(saved)
                                .likeCount(article.getLikeCount())
                                .build();
        }
}
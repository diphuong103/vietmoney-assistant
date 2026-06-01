package com.vietmoney.service;

import com.vietmoney.domain.entity.*;
import com.vietmoney.domain.enums.ArticleCategory;
import com.vietmoney.domain.enums.ArticleStatus;
import com.vietmoney.domain.enums.ArticleVisibility;
import com.vietmoney.domain.enums.NotificationType;
import com.vietmoney.dto.request.ArticleRequest;
import com.vietmoney.dto.request.CommentRequest;
import com.vietmoney.dto.request.MediaRequest;
import com.vietmoney.dto.response.ArticleCommentDto;
import com.vietmoney.dto.response.ArticleDto;
import com.vietmoney.dto.response.ArticleStatusResponse;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ArticleService {

        private final ArticleRepository articleRepository;
        private final UserRepository userRepository;
        private final ArticleLikeRepository articleLikeRepository;
        private final SavedArticleRepository savedArticleRepository;
        private final ArticleCommentRepository articleCommentRepository;
        private final ArticleHashtagRepository articleHashtagRepository;
        private final HashtagRepository hashtagRepository;
        private final UserFollowRepository userFollowRepository;
        private final NotificationService notificationService;

        // =====================================================
        // PRIVATE HELPERS
        // =====================================================

        private Pageable pageable(int page, int size) {
                return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        private Pageable pageableNoSort(int page, int size) {
                return PageRequest.of(page, size);
        }

        private User getUser(String username) {
                return userRepository.findByUsername(username)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        }

        private Article getArticle(Long articleId) {
                return articleRepository.findById(articleId)
                                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_FOUND));
        }

        private void loadRelations(Article article) {
                if (article.getMediaList() != null) {
                        article.getMediaList().size();
                }
        }

        private Page<ArticleDto> mapToDto(Page<Article> articles) {
                List<ArticleDto> content = articles.getContent()
                                .stream()
                                .map(article -> {
                                        loadRelations(article);
                                        return ArticleDto.from(article);
                                })
                                .collect(Collectors.toList());
                return new PageImpl<>(content, articles.getPageable(), articles.getTotalElements());
        }

        // =====================================================
        // PUBLIC FEED
        // =====================================================

        /**
         * Đọc toàn bộ article + mediaList trong cùng một transaction
         * rồi map sang DTO trước khi session đóng → tránh LazyInitializationException
         */
        @Transactional(readOnly = true)
        public Page<ArticleDto> getPublicFeed(int page, int size) {
                Page<Article> articles = articleRepository.findByStatusAndVisibilityAndDeletedFalse(
                                ArticleStatus.APPROVED, ArticleVisibility.PUBLIC, pageable(page, size));
                return mapToDto(articles);
        }

        // =====================================================
        // FOLLOWING FEED
        // =====================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> getFollowingFeed(String username, int page, int size) {
                User user = getUser(username);
                List<Long> followingIds = userFollowRepository.findByFollower(user)
                                .stream()
                                .map(follow -> follow.getFollowing().getId())
                                .collect(Collectors.toList());
                if (followingIds.isEmpty())
                        return Page.empty();
                Page<Article> articles = articleRepository.findFollowingFeed(
                                followingIds, ArticleStatus.APPROVED, pageable(page, size));
                return mapToDto(articles);
        }

        // =====================================================
        // ARTICLE DETAIL
        // =====================================================

        @Transactional
        public ArticleDto getArticleById(Long articleId) {
                Article article = getArticle(articleId);
                if (Boolean.TRUE.equals(article.getDeleted())) {
                        throw new AppException(ErrorCode.ARTICLE_NOT_FOUND);
                }
                article.setViewCount(article.getViewCount() + 1);
                Article saved = articleRepository.save(article);
                loadRelations(saved);
                return ArticleDto.from(saved);
        }

        // =====================================================
        // MY ARTICLES
        // =====================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> getMyArticles(String username, String status, int page, int size) {
                User user = getUser(username);
                Page<Article> articles;
                if (status != null && !status.isBlank()) {
                        ArticleStatus articleStatus = ArticleStatus.valueOf(status.toUpperCase());
                        articles = articleRepository.findByAuthorAndStatusAndDeletedFalse(
                                        user, articleStatus, pageable(page, size));
                } else {
                        articles = articleRepository.findByAuthorAndDeletedFalse(user, pageable(page, size));
                }
                return mapToDto(articles);
        }

        // =====================================================
        // USER ARTICLES
        // =====================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> getUserArticles(Long userId, int page, int size) {
                Page<Article> articles = articleRepository.findByAuthorIdAndDeletedFalse(
                                userId, pageable(page, size));
                return mapToDto(articles);
        }

        // =====================================================
        // CATEGORY
        // =====================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> getByCategory(String category, int page, int size) {
                ArticleCategory articleCategory = ArticleCategory.valueOf(category.toUpperCase());
                Page<Article> articles = articleRepository.findByCategoryAndStatusAndDeletedFalse(
                                articleCategory, ArticleStatus.APPROVED, pageable(page, size));
                return mapToDto(articles);
        }

        // =====================================================
        // LOCATION
        // =====================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> getByLocation(String location, int page, int size) {
                Page<Article> articles = articleRepository
                                .findByLocationContainingIgnoreCaseAndDeletedFalse(location, pageable(page, size));
                return mapToDto(articles);
        }

        // =====================================================
        // TRENDING
        // =====================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> getTrending(int page, int size) {
                Page<Article> articles = articleRepository.findTrending(pageable(page, size));
                return mapToDto(articles);
        }

        // =====================================================
        // FEATURED
        // =====================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> getFeatured(int page, int size) {
                Page<Article> articles = articleRepository
                                .findByIsFeaturedTrueAndDeletedFalse(pageable(page, size));
                return mapToDto(articles);
        }

        // =====================================================
        // SEARCH — pageableNoSort() vì native query đã có ORDER BY
        // =====================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> searchArticles(String keyword, int page, int size) {
                Page<Article> articles = articleRepository.searchArticles(
                                keyword, pageableNoSort(page, size));
                return mapToDto(articles);
        }

        // =====================================================
        // HASHTAG
        // =====================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> getByHashtag(String hashtag, int page, int size) {
                Page<Article> articles = articleRepository.findByHashtag(hashtag, pageable(page, size));
                return mapToDto(articles);
        }

        // =====================================================
        // RELATED ARTICLES
        // =====================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> getRelatedArticles(Long articleId, int page, int size) {
                Article article = getArticle(articleId);
                Page<Article> articles = articleRepository.findRelatedArticles(
                                article.getCategory(), articleId, pageable(page, size));
                return mapToDto(articles);
        }

        // =====================================================
        // CREATE ARTICLE
        // =====================================================

        public ArticleDto createArticle(String username, ArticleRequest request) {
                User author = getUser(username);

                Article article = Article.builder()
                                .author(author)
                                .title(request.getTitle())
                                .content(request.getContent())
                                .category(request.getCategory() != null
                                                ? ArticleCategory.valueOf(request.getCategory().toUpperCase())
                                                : ArticleCategory.GENERAL)
                                .visibility(request.getVisibility() != null
                                                ? ArticleVisibility.valueOf(request.getVisibility().toUpperCase())
                                                : ArticleVisibility.PUBLIC)
                                .status(request.getStatus() != null
                                                ? ArticleStatus.valueOf(request.getStatus().toUpperCase())
                                                : ArticleStatus.PENDING)
                                .location(request.getLocation())
                                .touristSpot(request.getTouristSpotId() != null
                                                ? TouristSpot.builder().id(request.getTouristSpotId()).build()
                                                : null)
                                .travelPlan(request.getTravelPlanId() != null
                                                ? TravelPlan.builder().id(request.getTravelPlanId()).build()
                                                : null)
                                .cityPriceWiki(request.getCityPriceWikiId() != null
                                                ? CityPriceWiki.builder().id(request.getCityPriceWikiId()).build()
                                                : null)
                                .deleted(false)
                                .isFeatured(false)
                                .isEdited(false)
                                .likeCount(0L)
                                .saveCount(0L)
                                .commentCount(0L)
                                .shareCount(0L)
                                .viewCount(0L)
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

                if (request.getHashtags() != null) {
                        for (String tag : request.getHashtags()) {
                                String cleanTag = tag.trim().replace("#", "");
                                if (cleanTag.isBlank())
                                        continue;
                                Hashtag hashtag = hashtagRepository.findByName(cleanTag)
                                                .orElseGet(() -> hashtagRepository.save(
                                                                Hashtag.builder().name(cleanTag).build()));
                                if (!articleHashtagRepository.existsByArticleAndHashtag(savedArticle, hashtag)) {
                                        articleHashtagRepository.save(
                                                        ArticleHashtag.builder().article(savedArticle).hashtag(hashtag)
                                                                        .build());
                                }
                        }
                }

                Article result = articleRepository.save(savedArticle);
                loadRelations(result);
                return ArticleDto.from(result);
        }

        // =====================================================
        // UPDATE ARTICLE
        // =====================================================

        public ArticleDto updateArticle(String username, Long articleId, ArticleRequest request) {
                User user = getUser(username);
                Article article = getArticle(articleId);
                if (!article.getAuthor().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.FORBIDDEN);
                }

                article.setTitle(request.getTitle());
                article.setContent(request.getContent());
                article.setLocation(request.getLocation());
                article.setUpdatedAt(LocalDateTime.now());
                article.setEditedAt(LocalDateTime.now());
                article.setIsEdited(true);

                if (request.getCategory() != null) {
                        article.setCategory(ArticleCategory.valueOf(request.getCategory().toUpperCase()));
                }
                if (request.getVisibility() != null) {
                        article.setVisibility(ArticleVisibility.valueOf(request.getVisibility().toUpperCase()));
                }
                if (request.getStatus() != null) {
                        article.setStatus(ArticleStatus.valueOf(request.getStatus().toUpperCase()));
                }

                article.setTouristSpot(request.getTouristSpotId() != null
                                ? TouristSpot.builder().id(request.getTouristSpotId()).build()
                                : null);
                article.setTravelPlan(request.getTravelPlanId() != null
                                ? TravelPlan.builder().id(request.getTravelPlanId()).build()
                                : null);
                article.setCityPriceWiki(request.getCityPriceWikiId() != null
                                ? CityPriceWiki.builder().id(request.getCityPriceWikiId()).build()
                                : null);

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

                articleHashtagRepository.deleteByArticleId(articleId);
                if (request.getHashtags() != null) {
                        for (String tag : request.getHashtags()) {
                                String cleanTag = tag.trim().replace("#", "");
                                if (cleanTag.isBlank())
                                        continue;
                                Hashtag hashtag = hashtagRepository.findByName(cleanTag)
                                                .orElseGet(() -> hashtagRepository.save(
                                                                Hashtag.builder().name(cleanTag).build()));
                                articleHashtagRepository.save(
                                                ArticleHashtag.builder().article(article).hashtag(hashtag).build());
                        }
                }

                Article result = articleRepository.save(article);
                loadRelations(result);
                return ArticleDto.from(result);
        }

        // =====================================================
        // SOFT DELETE
        // =====================================================

        @Transactional
        public void softDeleteArticle(String username, Long articleId) {
                User user = getUser(username);
                Article article = getArticle(articleId);
                if (!article.getAuthor().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.FORBIDDEN);
                }

                article.setDeleted(true);
                articleRepository.save(article);
        }

        // =====================================================
        // HARD DELETE
        // =====================================================

        public void hardDeleteArticle(Long articleId) {
                articleLikeRepository.deleteByArticleId(articleId);
                savedArticleRepository.deleteByArticleId(articleId);
                articleCommentRepository.deleteByArticleId(articleId);
                articleHashtagRepository.deleteByArticleId(articleId);
                articleRepository.deleteById(articleId);
        }

        // =====================================================
        // LIKE
        // =====================================================

        @Transactional
        public ArticleStatusResponse toggleLike(String username, Long articleId) {
                User user = getUser(username);
                Article article = getArticle(articleId);
                boolean liked;

                Optional<ArticleLike> existingLike = articleLikeRepository.findByUserAndArticle(user, article);

                if (existingLike.isPresent()) {
                        articleLikeRepository.delete(existingLike.get());
                        Long currentLikeCount = article.getLikeCount() != null ? article.getLikeCount() : 0L;
                        article.setLikeCount(Math.max(0L, currentLikeCount - 1L));
                        articleRepository.save(article);
                        liked = false;
                } else {
                        articleLikeRepository.save(ArticleLike.builder().user(user).article(article).build());
                        Long currentLikeCount = article.getLikeCount() != null ? article.getLikeCount() : 0L;
                        article.setLikeCount(currentLikeCount + 1L);
                        articleRepository.save(article);
                        liked = true;
                        try {
                                if (!article.getAuthor().getId().equals(user.getId())) {
                                        notificationService.sendTo(
                                                        article.getAuthor(),
                                                        NotificationType.ARTICLE_LIKED,
                                                        "Bài viết mới được thích",
                                                        user.getFullName() + " đã thích bài viết của bạn",
                                                        "/news/" + article.getId());
                                }
                        } catch (Exception e) {
                                log.warn("Không gửi được notification like cho article {}: {}",
                                                article.getId(), e.getMessage());
                        }
                }

                return ArticleStatusResponse.builder()
                                .liked(liked)
                                .saved(savedArticleRepository.existsByUserAndArticle(user, article))
                                .likeCount(articleLikeRepository.countByArticle(article))
                                .saveCount(article.getSaveCount() != null ? article.getSaveCount() : 0)
                                .commentCount(article.getCommentCount() != null ? article.getCommentCount() : 0)
                                .viewCount(article.getViewCount() != null ? article.getViewCount() : 0)
                                .build();
        }

        // =====================================================
        // SAVE ARTICLE
        // =====================================================

        @Transactional
        public ArticleStatusResponse toggleSave(String username, Long articleId) {
                User user = getUser(username);
                Article article = getArticle(articleId);
                boolean saved;

                Optional<SavedArticle> existing = savedArticleRepository.findByUserAndArticle(user, article);

                if (existing.isPresent()) {
                        savedArticleRepository.delete(existing.get());
                        Long currentSaveCount = article.getSaveCount() != null ? article.getSaveCount() : 0L;
                        article.setSaveCount(Math.max(0L, currentSaveCount - 1L));
                        saved = false;
                } else {
                        savedArticleRepository.save(SavedArticle.builder().user(user).article(article).build());
                        Long currentSaveCount = article.getSaveCount() != null ? article.getSaveCount() : 0L;
                        article.setSaveCount(currentSaveCount + 1L);
                        saved = true;
                }
                articleRepository.save(article);

                return ArticleStatusResponse.builder()
                                .liked(articleLikeRepository.existsByUserAndArticle(user, article))
                                .saved(saved)
                                .likeCount(article.getLikeCount() != null ? article.getLikeCount() : 0)
                                .saveCount(article.getSaveCount() != null ? article.getSaveCount() : 0)
                                .commentCount(article.getCommentCount() != null ? article.getCommentCount() : 0)
                                .viewCount(article.getViewCount() != null ? article.getViewCount() : 0)
                                .build();
        }

        // =====================================================
        // ARTICLE STATUS
        // =====================================================

        @Transactional(readOnly = true)
        public ArticleStatusResponse getArticleStatus(String username, Long articleId) {
                User user = getUser(username);
                Article article = getArticle(articleId);
                return ArticleStatusResponse.builder()
                                .liked(articleLikeRepository.existsByUserAndArticle(user, article))
                                .saved(savedArticleRepository.existsByUserAndArticle(user, article))
                                .likeCount(articleLikeRepository.countByArticle(article))
                                .saveCount(article.getSaveCount() != null ? article.getSaveCount() : 0)
                                .commentCount(article.getCommentCount() != null ? article.getCommentCount() : 0)
                                .viewCount(article.getViewCount() != null ? article.getViewCount() : 0)
                                .build();
        }

        // =====================================================
        // SAVED ARTICLES
        // =====================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> getSavedArticles(String username, int page, int size) {
                User user = getUser(username);
                Page<SavedArticle> saved = savedArticleRepository.findByUser(user, pageable(page, size));
                List<ArticleDto> content = saved.getContent()
                                .stream()
                                .map(s -> {
                                        loadRelations(s.getArticle());
                                        return ArticleDto.from(s.getArticle());
                                })
                                .collect(Collectors.toList());
                return new PageImpl<>(content, saved.getPageable(), saved.getTotalElements());
        }

        // =====================================================
        // ADMIN
        // =====================================================

        @Transactional(readOnly = true)
        public Page<ArticleDto> getArticlesByStatus(String status, int page, int size) {
                ArticleStatus articleStatus = ArticleStatus.valueOf(status.toUpperCase());
                Page<Article> articles = articleRepository.findByStatus(articleStatus, pageable(page, size));
                return mapToDto(articles);
        }

        public ArticleDto approveArticle(Long articleId) {
                Article article = getArticle(articleId);
                article.setStatus(ArticleStatus.APPROVED);
                article.setPublishedAt(LocalDateTime.now());
                Article saved = articleRepository.save(article);
                try {
                        notificationService.sendTo(
                                        article.getAuthor(),
                                        NotificationType.ARTICLE_APPROVED,
                                        "Bài viết được duyệt",
                                        "Bài viết \"" + article.getTitle() + "\" đã được phê duyệt",
                                        "/news/" + article.getId());
                } catch (Exception e) {
                        log.warn("Không gửi được notification approve cho article {}: {}",
                                        article.getId(), e.getMessage());
                }
                loadRelations(saved);
                return ArticleDto.from(saved);
        }

        public ArticleDto rejectArticle(Long articleId, String reason) {
                Article article = getArticle(articleId);
                article.setStatus(ArticleStatus.REJECTED);
                article.setRejectionReason(reason);
                Article saved = articleRepository.save(article);
                try {
                        notificationService.sendTo(
                                        article.getAuthor(),
                                        NotificationType.ARTICLE_REJECTED,
                                        "Bài viết bị từ chối",
                                        "Lý do: " + reason,
                                        "/news");
                } catch (Exception e) {
                        log.warn("Không gửi được notification reject cho article {}: {}",
                                        article.getId(), e.getMessage());
                }
                loadRelations(saved);
                return ArticleDto.from(saved);
        }

        // =====================================================
        // STATISTICS
        // =====================================================

        @Transactional(readOnly = true)
        public long countApprovedArticles() {
                return articleRepository.countByStatus(ArticleStatus.APPROVED);
        }

        @Transactional(readOnly = true)
        public long countAllArticles() {
                return articleRepository.countByDeletedFalse();
        }

        @Transactional(readOnly = true)
        public long countUserArticles(String username) {
                User user = getUser(username);
                return articleRepository.countByAuthor(user);
        }

        // =====================================================
        // COMMENTS
        // =====================================================

        @Transactional(readOnly = true)
        public Page<ArticleCommentDto> getRootComments(Long articleId, int page, int size) {
                Article article = getArticle(articleId);
                Long authorId = article.getAuthor() != null ? article.getAuthor().getId() : null;

                Page<ArticleComment> comments = articleCommentRepository.findRootComments(
                                article, pageableNoSort(page, size));

                return comments.map(c -> {
                        ArticleCommentDto dto = ArticleCommentDto.from(c, authorId);
                        long replyCount = articleCommentRepository.countByParentCommentAndDeletedFalse(c);
                        dto.setReplyCount((int) replyCount);
                        return dto;
                });
        }

        @Transactional(readOnly = true)
        public List<ArticleCommentDto> getReplies(Long articleId, Long commentId) {
                Article article = getArticle(articleId);
                Long authorId = article.getAuthor() != null ? article.getAuthor().getId() : null;

                ArticleComment parent = articleCommentRepository.findById(commentId)
                                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

                return articleCommentRepository.findByParentCommentAndDeletedFalse(parent)
                                .stream()
                                .map(c -> ArticleCommentDto.from(c, authorId))
                                .collect(Collectors.toList());
        }

        public ArticleCommentDto createComment(String username, Long articleId, CommentRequest request) {
                User user = getUser(username);
                Article article = getArticle(articleId);
                Long authorId = article.getAuthor() != null ? article.getAuthor().getId() : null;

                ArticleComment parent = null;
                if (request.getParentCommentId() != null) {
                        parent = articleCommentRepository.findById(request.getParentCommentId())
                                        .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
                }

                ArticleComment comment = ArticleComment.builder()
                                .user(user)
                                .article(article)
                                .content(request.getContent())
                                .parentComment(parent)
                                .likeCount(0L)
                                .isEdited(false)
                                .deleted(false)
                                .createdAt(LocalDateTime.now())
                                .build();

                ArticleComment saved = articleCommentRepository.save(comment);

                Long currentCommentCount = article.getCommentCount() != null ? article.getCommentCount() : 0L;
                article.setCommentCount(currentCommentCount + 1L);
                articleRepository.save(article);

                // Gửi notification cho tác giả bài viết (nếu người comment khác tác giả)
                try {
                        if (authorId != null && !authorId.equals(user.getId())) {
                                notificationService.sendTo(
                                                article.getAuthor(),
                                                NotificationType.ARTICLE_COMMENTED,
                                                "Bình luận mới",
                                                user.getFullName() + " đã bình luận bài viết của bạn",
                                                "/news/" + article.getId());
                        }
                } catch (Exception e) {
                        log.warn("Không gửi được notification comment cho article {}: {}",
                                        article.getId(), e.getMessage());
                }

                return ArticleCommentDto.from(saved, authorId);
        }

        public void deleteComment(String username, Long articleId, Long commentId) {
                User user = getUser(username);
                ArticleComment comment = articleCommentRepository.findById(commentId)
                                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
                if (!comment.getUser().getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.FORBIDDEN);
                }
                comment.setDeleted(true);
                articleCommentRepository.save(comment);
        }
}
package com.vietmoney.service;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.ArticleStatus;
import com.vietmoney.dto.request.ArticleRequest;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.repository.ArticleRepository;
import com.vietmoney.repository.SavedArticleRepository;
import com.vietmoney.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ArticleService {

        private final ArticleRepository articleRepository;
        private final UserRepository userRepository;
        private final SavedArticleRepository savedArticleRepository;

        public Page<Article> getApprovedArticles(int page, int size) {
                return articleRepository.findByStatus(ArticleStatus.APPROVED,
                                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        }

        public Page<Article> getPendingArticles(int page, int size) {
                return articleRepository.findByStatus(ArticleStatus.PENDING,
                                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        }

        public Page<Article> getArticlesByStatus(String statusStr, int page, int size) {
                if (statusStr == null || statusStr.isBlank()) {
                        return getPendingArticles(page, size);
                }
                ArticleStatus status = ArticleStatus.valueOf(statusStr.toUpperCase());
                return articleRepository.findByStatus(status,
                                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        }

        @Transactional
        public Article createArticle(String username, ArticleRequest request) {
                User author = userRepository.findByUsername(username)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                Article article = Article.builder()
                                .author(author)
                                .title(request.getTitle())
                                .content(request.getContent())
                                .thumbnailUrl(request.getThumbnailUrl())
                                .tags(request.getTags())
                                .status(ArticleStatus.PENDING)
                                .build();
                return articleRepository.save(article);
        }

        @Transactional
        public Article approveArticle(Long id) {
                Article article = articleRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_FOUND));
                article.setStatus(ArticleStatus.APPROVED);
                return articleRepository.save(article);
        }

        @Transactional
        public Article rejectArticle(Long id, String reason) {
                Article article = articleRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_FOUND));
                article.setStatus(ArticleStatus.REJECTED);
                article.setRejectionReason(reason);
                return articleRepository.save(article);
        }

        @Transactional
        public void likeArticle(String username, Long articleId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                Article article = articleRepository.findById(articleId)
                                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_FOUND));

                com.vietmoney.domain.entity.SavedArticle savedArticle = com.vietmoney.domain.entity.SavedArticle
                                .builder()
                                .user(user)
                                .article(article)
                                .build();
                savedArticleRepository.save(savedArticle);
        }

        public Page<Article> getMyArticles(String username, int page, int size) {
                User author = userRepository.findByUsername(username)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                return articleRepository.findByAuthor(author,
                        PageRequest.of(page, size, Sort.by("createdAt").descending()));
        }

        public Article getArticleById(Long id) {
                return articleRepository.findById(id)
                        .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_FOUND));
        }

        @Transactional
        public void deleteArticle(Long id) {
                articleRepository.deleteById(id);
        }
}

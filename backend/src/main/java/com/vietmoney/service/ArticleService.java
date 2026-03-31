package com.vietmoney.service;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.ArticleStatus;
import com.vietmoney.dto.request.ArticleRequest;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.repository.ArticleRepository;
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

    public Page<Article> getApprovedArticles(int page, int size) {
        return articleRepository.findByStatus(ArticleStatus.APPROVED,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    public Page<Article> getPendingArticles(int page, int size) {
        return articleRepository.findByStatus(ArticleStatus.PENDING,
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
}

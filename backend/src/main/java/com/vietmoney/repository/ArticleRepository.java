package com.vietmoney.repository;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.domain.enums.ArticleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    Page<Article> findByStatus(ArticleStatus status, Pageable pageable);
    Page<Article> findByAuthorId(Long authorId, Pageable pageable);
}

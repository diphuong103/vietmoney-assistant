package com.vietmoney.repository;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.ArticleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    // ================= PUBLIC FEED =================

    Page<Article> findByStatusAndDeletedFalse(
            ArticleStatus status,
            Pageable pageable
    );

    // ================= USER POSTS =================

    Page<Article> findByAuthorAndDeletedFalse(
            User author,
            Pageable pageable
    );

    Page<Article> findByAuthorAndStatusAndDeletedFalse(
            User author,
            ArticleStatus status,
            Pageable pageable
    );

    // ================= LEGACY =================

    Page<Article> findByStatus(
            ArticleStatus status,
            Pageable pageable
    );

    Page<Article> findByAuthor(
            User author,
            Pageable pageable
    );

    Page<Article> findByAuthorId(
            Long authorId,
            Pageable pageable
    );

    // ================= STATISTICS =================

    long countByStatus(ArticleStatus status);

    @Modifying
    @Query("DELETE FROM Article a WHERE a.author.id = :userId")
    void deleteByAuthorId(@Param("userId") Long userId);
}
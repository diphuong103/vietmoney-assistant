package com.vietmoney.repository;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.domain.entity.ArticleComment;
import com.vietmoney.domain.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleCommentRepository
        extends JpaRepository<ArticleComment, Long> {

    // =====================================================
    // ARTICLE COMMENTS
    // =====================================================

    Page<ArticleComment> findByArticleAndDeletedFalse(
            Article article,
            Pageable pageable
    );

    // =====================================================
    // ROOT COMMENTS
    // =====================================================

    @Query("""
        SELECT ac
        FROM ArticleComment ac
        WHERE ac.article = :article
          AND ac.parentComment IS NULL
          AND ac.deleted = false
        ORDER BY ac.createdAt DESC
    """)
    Page<ArticleComment> findRootComments(
            @Param("article") Article article,
            Pageable pageable
    );

    // =====================================================
    // REPLIES
    // =====================================================

    List<ArticleComment> findByParentCommentAndDeletedFalse(
            ArticleComment parentComment
    );

    long countByParentCommentAndDeletedFalse(
            ArticleComment parentComment
    );

    // =====================================================
    // USER COMMENTS
    // =====================================================

    Page<ArticleComment> findByUserAndDeletedFalse(
            User user,
            Pageable pageable
    );

    // =====================================================
    // COUNTS
    // =====================================================

    long countByArticleAndDeletedFalse(
            Article article
    );

    long countByUserAndDeletedFalse(
            User user
    );

    // =====================================================
    // DELETE
    // =====================================================

    @Modifying
    @Query("""
        DELETE FROM ArticleComment ac
        WHERE ac.article.id = :articleId
    """)
    void deleteByArticleId(
            @Param("articleId") Long articleId
    );

    @Modifying
    @Query("""
        DELETE FROM ArticleComment ac
        WHERE ac.user.id = :userId
    """)
    void deleteByUserId(
            @Param("userId") Long userId
    );
}
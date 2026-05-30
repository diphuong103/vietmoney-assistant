package com.vietmoney.repository;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.domain.entity.SavedArticle;
import com.vietmoney.domain.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedArticleRepository
        extends JpaRepository<SavedArticle, Long> {

    // BASIC

    Optional<SavedArticle> findByUserAndArticle(
            User user,
            Article article
    );

    boolean existsByUserAndArticle(
            User user,
            Article article
    );

    // USER SAVED POSTS

    Page<SavedArticle> findByUser(
            User user,
            Pageable pageable
    );

    List<SavedArticle> findByUserAndFolder(
            User user,
            String folder
    );

    // COUNTS

    long countByArticle(Article article);

    long countByUser(User user);

    // DELETE

    @Modifying
    @Query("""
        DELETE FROM SavedArticle sa
        WHERE sa.user.id = :userId
    """)
    void deleteByUserId(
            @Param("userId") Long userId
    );

    @Modifying
    @Query("""
        DELETE FROM SavedArticle sa
        WHERE sa.article.id = :articleId
    """)
    void deleteByArticleId(
            @Param("articleId") Long articleId
    );

    @Modifying
    @Query("""
        DELETE FROM SavedArticle sa
        WHERE sa.article.author.id = :authorId
    """)
    void deleteByArticleAuthorId(
            @Param("authorId") Long authorId
    );
}
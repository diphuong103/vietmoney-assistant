package com.vietmoney.repository;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.domain.entity.ArticleLike;
import com.vietmoney.domain.entity.User;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArticleLikeRepository extends JpaRepository<ArticleLike, Long> {

    Optional<ArticleLike> findByUserAndArticle(User user, Article article);

    boolean existsByUserAndArticle(User user, Article article);

    long countByArticle(Article article);

    long countByUser(User user);

    List<ArticleLike> findByArticle(Article article);

    List<ArticleLike> findByUser(User user);

    @Modifying
    @Query("""
        DELETE FROM ArticleLike al
        WHERE al.article.id = :articleId
    """)
    void deleteByArticleId(@Param("articleId") Long articleId);

    @Modifying
    @Query("""
        DELETE FROM ArticleLike al
        WHERE al.user.id = :userId
    """)
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("""
        DELETE FROM ArticleLike al
        WHERE al.article.author.id = :authorId
    """)
    void deleteByArticleAuthorId(@Param("authorId") Long authorId);
}
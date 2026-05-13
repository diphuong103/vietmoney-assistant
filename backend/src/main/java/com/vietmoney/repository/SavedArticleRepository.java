package com.vietmoney.repository;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.domain.entity.SavedArticle;
import com.vietmoney.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavedArticleRepository extends JpaRepository<SavedArticle, Long> {
    Optional<SavedArticle> findByUserAndArticle(User user, Article article);
    boolean existsByUserAndArticle(User user, Article article);
    @Modifying
    @Query("DELETE FROM SavedArticle sa WHERE sa.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM SavedArticle sa WHERE sa.article.author.id = :authorId")
    void deleteByArticleAuthorId(@Param("authorId") Long authorId);
}

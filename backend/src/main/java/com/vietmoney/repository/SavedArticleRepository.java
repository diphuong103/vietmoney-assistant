package com.vietmoney.repository;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.domain.entity.SavedArticle;
import com.vietmoney.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavedArticleRepository extends JpaRepository<SavedArticle, Long> {
    Optional<SavedArticle> findByUserAndArticle(User user, Article article);
    boolean existsByUserAndArticle(User user, Article article);
}

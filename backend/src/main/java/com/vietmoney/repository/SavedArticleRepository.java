package com.vietmoney.repository;

import com.vietmoney.domain.entity.SavedArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SavedArticleRepository extends JpaRepository<SavedArticle, Long> {
}

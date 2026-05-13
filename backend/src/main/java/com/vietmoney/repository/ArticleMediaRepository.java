package com.vietmoney.repository;

import com.vietmoney.domain.entity.ArticleMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ArticleMediaRepository extends JpaRepository<ArticleMedia, Long> {

    @Modifying
    @Query("DELETE FROM ArticleMedia am WHERE am.article.author.id = :authorId")
    void deleteByArticleAuthorId(@Param("authorId") Long authorId);
}
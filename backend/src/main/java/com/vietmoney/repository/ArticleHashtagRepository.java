package com.vietmoney.repository;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.domain.entity.ArticleHashtag;
import com.vietmoney.domain.entity.ArticleHashtagId;
import com.vietmoney.domain.entity.Hashtag;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleHashtagRepository
        extends JpaRepository<ArticleHashtag, ArticleHashtagId> {

    // =====================================================
    // ARTICLE HASHTAGS
    // =====================================================

    List<ArticleHashtag> findByArticle(
            Article article
    );

    // =====================================================
    // HASHTAG ARTICLES
    // =====================================================

    List<ArticleHashtag> findByHashtag(
            Hashtag hashtag
    );

    // =====================================================
    // EXISTS
    // =====================================================

    boolean existsByArticleAndHashtag(
            Article article,
            Hashtag hashtag
    );

    // =====================================================
    // DELETE
    // =====================================================

    @Modifying
    @Query("""
        DELETE FROM ArticleHashtag ah
        WHERE ah.article.id = :articleId
    """)
    void deleteByArticleId(
            @Param("articleId") Long articleId
    );

    @Modifying
    @Query("""
        DELETE FROM ArticleHashtag ah
        WHERE ah.hashtag.id = :hashtagId
    """)
    void deleteByHashtagId(
            @Param("hashtagId") Long hashtagId
    );
}
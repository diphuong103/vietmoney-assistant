package com.vietmoney.repository;

import com.vietmoney.domain.entity.Article;
import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.ArticleCategory;
import com.vietmoney.domain.enums.ArticleStatus;
import com.vietmoney.domain.enums.ArticleVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    // PUBLIC FEED

    Page<Article> findByStatusAndVisibilityAndDeletedFalse(
            ArticleStatus status,
            ArticleVisibility visibility,
            Pageable pageable
    );

    // FOLLOWING FEED

    @Query("""
        SELECT a
        FROM Article a
        WHERE a.author.id IN :followingIds
        AND a.deleted = false
        AND a.status = :status
        ORDER BY a.createdAt DESC
    """)
    Page<Article> findFollowingFeed(
            @Param("followingIds") List<Long> followingIds,
            @Param("status") ArticleStatus status,
            Pageable pageable
    );

    // USER POSTS

    Page<Article> findByAuthorAndDeletedFalse(
            User author,
            Pageable pageable
    );

    Page<Article> findByAuthorInAndStatusAndDeletedFalse(
            List<User> authors,
            ArticleStatus status,
            Pageable pageable
    );

    Page<Article> findByAuthorIdAndDeletedFalse(
            Long authorId,
            Pageable pageable
    );

    // =====================================================
    // CATEGORY FILTER
    // =====================================================

    Page<Article> findByCategoryAndDeletedFalse(
            ArticleCategory category,
            Pageable pageable
    );

    Page<Article> findByCategoryAndStatusAndDeletedFalse(
            ArticleCategory category,
            ArticleStatus status,
            Pageable pageable
    );

    // =====================================================
    // LOCATION FILTER
    // =====================================================

    Page<Article> findByLocationContainingIgnoreCaseAndDeletedFalse(
            String location,
            Pageable pageable
    );

    // TRENDING / POPULAR

    @Query("""
    SELECT a
    FROM Article a
    WHERE a.deleted = false
    AND a.status = 'APPROVED'
    ORDER BY
    (
        a.viewCount * 1 +
        a.likeCount * 4 +
        a.commentCount * 6 +
        a.saveCount * 8
    ) DESC
    """)
    Page<Article> findTrending(Pageable pageable);

    // FEATURED POSTS

    Page<Article> findByIsFeaturedTrueAndDeletedFalse(
            Pageable pageable
    );

    // =====================================================
    // SEARCH TITLE + CONTENT
    //
    // FIX: native query không thể nhận Sort từ Pageable vì
    // Hibernate truyền tên Java field "createdAt" thay vì
    // tên cột MySQL "created_at"  →  SQLSyntaxErrorException.
    //
    // Giải pháp: hardcode ORDER BY created_at DESC trong SQL
    // và truyền vào PageRequest.of(page, size) KHÔNG có Sort
    // (xem ArticleService.searchArticles bên dưới).
    // =====================================================

    @Query(
            value = """
            SELECT *
            FROM articles
            WHERE MATCH(title, content)
            AGAINST (:keyword IN NATURAL LANGUAGE MODE)
            AND deleted = false
            ORDER BY created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM articles
            WHERE MATCH(title, content)
            AGAINST (:keyword IN NATURAL LANGUAGE MODE)
            AND deleted = false
            """,
            nativeQuery = true
    )
    Page<Article> searchArticles(
            @Param("keyword") String keyword,
            Pageable pageable
    );

    Page<Article> findByAuthorAndStatusAndDeletedFalse(
            User author,
            ArticleStatus status,
            Pageable pageable
    );

    // =====================================================
    // HASHTAG SEARCH
    // =====================================================

    @Query("""
        SELECT ah.article
        FROM ArticleHashtag ah
        WHERE ah.hashtag.name = :hashtag
        ORDER BY ah.article.createdAt DESC
    """)
    Page<Article> findByHashtag(
            @Param("hashtag") String hashtag,
            Pageable pageable
    );

    // =====================================================
    // RELATED POSTS
    // =====================================================

    @Query("""
        SELECT a
        FROM Article a
        WHERE a.category = :category
        AND a.id <> :articleId
        AND a.deleted = false
        ORDER BY a.createdAt DESC
    """)
    Page<Article> findRelatedArticles(
            @Param("category") ArticleCategory category,
            @Param("articleId") Long articleId,
            Pageable pageable
    );

    // =====================================================
    // STATISTICS
    // =====================================================

    long countByStatus(ArticleStatus status);

    long countByAuthor(User author);

    long countByDeletedFalse();

    // =====================================================
    // ADMIN
    // =====================================================

    Page<Article> findByStatus(
            ArticleStatus status,
            Pageable pageable
    );

    // =====================================================
    // DELETE
    // =====================================================

    @Modifying
    @Query("""
        DELETE FROM Article a
        WHERE a.author.id = :userId
    """)
    void deleteByAuthorId(@Param("userId") Long userId);
}
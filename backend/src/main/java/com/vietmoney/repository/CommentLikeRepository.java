package com.vietmoney.repository;

import com.vietmoney.domain.entity.ArticleComment;
import com.vietmoney.domain.entity.CommentLike;
import com.vietmoney.domain.entity.User;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentLikeRepository
        extends JpaRepository<CommentLike, Long> {

    // =====================================================
    // BASIC
    // =====================================================

    Optional<CommentLike> findByUserAndComment(
            User user,
            ArticleComment comment
    );

    boolean existsByUserAndComment(
            User user,
            ArticleComment comment
    );

    // =====================================================
    // LIST
    // =====================================================

    List<CommentLike> findByComment(
            ArticleComment comment
    );

    List<CommentLike> findByUser(
            User user
    );

    // =====================================================
    // COUNTS
    // =====================================================

    long countByComment(
            ArticleComment comment
    );

    // =====================================================
    // DELETE
    // =====================================================

    @Modifying
    @Query("""
        DELETE FROM CommentLike cl
        WHERE cl.comment.id = :commentId
    """)
    void deleteByCommentId(
            @Param("commentId") Long commentId
    );

    @Modifying
    @Query("""
        DELETE FROM CommentLike cl
        WHERE cl.user.id = :userId
    """)
    void deleteByUserId(
            @Param("userId") Long userId
    );
}
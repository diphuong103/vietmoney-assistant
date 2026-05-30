package com.vietmoney.repository;

import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.entity.UserFollow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFollowRepository
        extends JpaRepository<UserFollow, Long> {

    // =====================================================
    // BASIC
    // =====================================================

    Optional<UserFollow> findByFollowerAndFollowing(
            User follower,
            User following
    );

    boolean existsByFollowerAndFollowing(
            User follower,
            User following
    );

    // =====================================================
    // FOLLOWING
    // =====================================================

    List<UserFollow> findByFollower(
            User follower
    );

    Page<UserFollow> findByFollower(
            User follower,
            Pageable pageable
    );

    // =====================================================
    // FOLLOWERS
    // =====================================================

    List<UserFollow> findByFollowing(
            User following
    );

    Page<UserFollow> findByFollowing(
            User following,
            Pageable pageable
    );

    // =====================================================
    // COUNTS
    // =====================================================

    long countByFollower(
            User follower
    );

    long countByFollowing(
            User following
    );

    // =====================================================
    // DELETE
    // =====================================================

    @Modifying
    @Query("""
        DELETE FROM UserFollow uf
        WHERE uf.follower.id = :userId
    """)
    void deleteByFollowerId(
            @Param("userId") Long userId
    );

    @Modifying
    @Query("""
        DELETE FROM UserFollow uf
        WHERE uf.following.id = :userId
    """)
    void deleteByFollowingId(
            @Param("userId") Long userId
    );
}
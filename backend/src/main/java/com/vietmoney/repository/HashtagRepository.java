package com.vietmoney.repository;

import com.vietmoney.domain.entity.Hashtag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HashtagRepository
        extends JpaRepository<Hashtag, Long> {

    // =====================================================
    // BASIC
    // =====================================================

    Optional<Hashtag> findByName(
            String name
    );

    boolean existsByName(
            String name
    );

    // =====================================================
    // SEARCH
    // =====================================================

    Page<Hashtag> findByNameContainingIgnoreCase(
            String keyword,
            Pageable pageable
    );
}
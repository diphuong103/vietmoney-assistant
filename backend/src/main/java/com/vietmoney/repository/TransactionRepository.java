package com.vietmoney.repository;

import com.vietmoney.domain.entity.Transaction;
import com.vietmoney.domain.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("""
        SELECT t FROM Transaction t
        LEFT JOIN FETCH t.category
        WHERE t.user.id = :userId
        ORDER BY t.createdAt DESC
    """)
    List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("""
        SELECT t FROM Transaction t
        LEFT JOIN FETCH t.category
        WHERE t.id = :id
    """)
    Optional<Transaction> findByIdWithCategory(Long id);

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM Transaction t
        WHERE t.user.id = :userId
        AND t.type = :type
        AND t.createdAt >= :start
        AND t.createdAt < :end
    """)
    BigDecimal sumTodayByUserAndType(
            Long userId,
            CategoryType type,
            LocalDateTime start,
            LocalDateTime end
    );
}
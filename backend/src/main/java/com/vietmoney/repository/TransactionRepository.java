package com.vietmoney.repository;

import com.vietmoney.domain.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vietmoney.domain.enums.TransactionType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("SELECT t FROM Transaction t LEFT JOIN FETCH t.category WHERE t.id = :id")
    Optional<Transaction> findByIdWithCategory(@Param("id") Long id);

    List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT SUM(t.amount) FROM Transaction t " +
            "WHERE t.user.id = :userId AND " +
            "(t.type = 'EXPENSE' OR t.type = :type) AND " +
            "t.createdAt >= :startDate AND t.createdAt < :endDate")
    BigDecimal sumTodayByUserAndType(@Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}

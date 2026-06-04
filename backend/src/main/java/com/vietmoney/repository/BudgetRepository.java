package com.vietmoney.repository;

import com.vietmoney.domain.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Budget> findByIdAndUserId(Long id, Long userId);

    Optional<Budget> findFirstByUserIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long userId,
            LocalDate today1,
            LocalDate today2
    );

    void deleteByUserId(Long userId);

    @Query("""
    SELECT b FROM Budget b
    WHERE b.user.id = :userId
      AND b.startDate <= :endDate
      AND b.endDate >= :startDate
""")
    List<Budget> findOverlappingBudgets(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
    SELECT b FROM Budget b
    WHERE b.user.id = :userId
      AND b.id <> :budgetId
      AND b.startDate <= :endDate
      AND b.endDate >= :startDate
""")
    List<Budget> findOverlappingBudgetsExceptCurrent(
            @Param("userId") Long userId,
            @Param("budgetId") Long budgetId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
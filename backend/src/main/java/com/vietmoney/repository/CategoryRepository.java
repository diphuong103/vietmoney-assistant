package com.vietmoney.repository;

import com.vietmoney.domain.entity.Category;
import com.vietmoney.domain.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Category> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, CategoryType type);

    Optional<Category> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndNameIgnoreCaseAndType(Long userId, String name, CategoryType type);
}
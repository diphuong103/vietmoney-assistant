
package com.vietmoney.repository;

import com.vietmoney.domain.entity.PriceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PriceCategoryRepository extends JpaRepository<PriceCategory, Long> {

    List<PriceCategory> findByActiveTrueOrderByDisplayOrderAsc();

    boolean existsByNameIgnoreCase(String name);

    Optional<PriceCategory> findByNameIgnoreCase(String name);
}
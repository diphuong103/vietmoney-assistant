
package com.vietmoney.repository;

import com.vietmoney.domain.entity.PriceUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PriceUnitRepository extends JpaRepository<PriceUnit, Long> {

    List<PriceUnit> findByActiveTrueOrderByDisplayOrderAsc();

    boolean existsByNameIgnoreCase(String name);

    Optional<PriceUnit> findByNameIgnoreCase(String name);
}
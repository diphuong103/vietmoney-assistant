package com.vietmoney.repository;

import com.vietmoney.domain.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CountryRepository extends JpaRepository<Country, Long> {

    List<Country> findByActiveTrueOrderByNameAsc();

    Optional<Country> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);
}
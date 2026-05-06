package com.vietmoney.repository;

import com.vietmoney.domain.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CityRepository extends JpaRepository<City, Long> {

    List<City> findByActiveTrueOrderByNameAsc();

    List<City> findByCountryIdAndActiveTrue(Long countryId);

    boolean existsByCountryIdAndNormalizedName(Long countryId, String normalizedName);
}
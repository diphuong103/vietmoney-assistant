package com.vietmoney.repository;

import com.vietmoney.domain.entity.CityPriceWiki;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CityPriceWikiRepository extends JpaRepository<CityPriceWiki, Long> {
}

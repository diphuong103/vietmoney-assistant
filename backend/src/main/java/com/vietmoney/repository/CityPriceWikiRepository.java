package com.vietmoney.repository;

import com.vietmoney.domain.entity.CityPriceWiki;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CityPriceWikiRepository extends JpaRepository<CityPriceWiki, Long> {

    @Query("SELECT p FROM CityPriceWiki p " +
            "JOIN FETCH p.categoryRef " +
            "JOIN FETCH p.unitRef " +
            "WHERE LOWER(p.city) = LOWER(:city)")
    List<CityPriceWiki> findByCityIgnoreCase(@Param("city") String city);

    List<CityPriceWiki> findByCityAndCategoryRef_Id(String city, Long categoryId);
}
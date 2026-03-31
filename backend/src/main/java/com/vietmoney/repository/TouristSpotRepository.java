package com.vietmoney.repository;

import com.vietmoney.domain.entity.TouristSpot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TouristSpotRepository extends JpaRepository<TouristSpot, Long> {
}

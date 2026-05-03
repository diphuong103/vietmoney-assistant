package com.vietmoney.repository;

import com.vietmoney.domain.entity.AtmCache;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AtmCacheRepository extends JpaRepository<AtmCache, Long> {

    Optional<AtmCache> findByPlaceId(String placeId);

    List<AtmCache> findByGridKey(String gridKey);

    /** Kiểm tra khu vực đã scan và còn TTL */
    boolean existsByGridKeyAndScannedAtAfter(String gridKey, LocalDateTime after);
}
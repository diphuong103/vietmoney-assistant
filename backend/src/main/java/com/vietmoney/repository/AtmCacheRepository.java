package com.vietmoney.repository;

import com.vietmoney.domain.entity.AtmCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AtmCacheRepository extends JpaRepository<AtmCache, Long> {

    Optional<AtmCache> findByPlaceId(String placeId);

    List<AtmCache> findByGridKey(String gridKey);

    /** Kiểm tra khu vực đã scan và còn TTL */
    boolean existsByGridKeyAndScannedAtAfter(String gridKey, LocalDateTime after);

    /**
     * Bounding box query: lấy ATM có lat/lng trong hình chữ nhật và còn TTL.
     * Java-side sẽ tiếp tục lọc chính xác bằng Haversine.
     */
    @Query("SELECT a FROM AtmCache a WHERE " +
            "a.lat IS NOT NULL AND a.lng IS NOT NULL AND " +
            "a.lat BETWEEN :minLat AND :maxLat AND " +
            "a.lng BETWEEN :minLng AND :maxLng AND " +
            "a.scannedAt > :after")
    List<AtmCache> findByBoundingBoxAndTtl(
            @Param("minLat") double minLat, @Param("maxLat") double maxLat,
            @Param("minLng") double minLng, @Param("maxLng") double maxLng,
            @Param("after") LocalDateTime after);

    /**
     * Lấy tất cả ATM chưa có tọa độ trong grid key (để enrich).
     */
    List<AtmCache> findByGridKeyAndLatIsNull(String gridKey);
}
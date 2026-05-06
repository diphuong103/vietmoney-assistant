package com.vietmoney.repository;

import com.vietmoney.domain.entity.AtmCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AtmCacheRepository extends JpaRepository<AtmCache, Long> {

    Optional<AtmCache> findByPlaceId(String placeId);

    /**
     * Fast bounding-box query using lat/lng index.
     * Caller must do Haversine filtering afterwards for exact radius.
     */
    @Query("""
        SELECT a FROM AtmCache a
        WHERE a.lat BETWEEN :minLat AND :maxLat
          AND a.lng BETWEEN :minLng AND :maxLng
          AND a.lat IS NOT NULL
          AND a.lng IS NOT NULL
        """)
    List<AtmCache> findByBoundingBox(
            double minLat, double maxLat,
            double minLng, double maxLng
    );

    /** Count ATMs in a bounding box (used to verify scan coverage) */
    @Query("""
        SELECT COUNT(a) FROM AtmCache a
        WHERE a.lat BETWEEN :minLat AND :maxLat
          AND a.lng BETWEEN :minLng AND :maxLng
          AND a.lat IS NOT NULL
        """)
    long countByBoundingBox(double minLat, double maxLat, double minLng, double maxLng);

    /** Delete stale entries older than cutoff */
    @Modifying
    @Transactional
    @Query("DELETE FROM AtmCache a WHERE a.scannedAt < :cutoff AND a.scannedAt IS NOT NULL")
    int deleteByScannedAtBefore(LocalDateTime cutoff);
}
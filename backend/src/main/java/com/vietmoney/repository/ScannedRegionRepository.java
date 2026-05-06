package com.vietmoney.repository;

import com.vietmoney.domain.entity.ScannedRegion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScannedRegionRepository extends JpaRepository<ScannedRegion, Long> {

    /** Find a specific cell by grid coordinates */
    Optional<ScannedRegion> findByGridLatAndGridLng(int gridLat, int gridLng);

    /**
     * Find all cells within a bounding box of grid coordinates
     * AND not expired (scanned within TTL window).
     */
    @Query("""
        SELECT r FROM ScannedRegion r
        WHERE r.gridLat BETWEEN :minGLat AND :maxGLat
          AND r.gridLng BETWEEN :minGLng AND :maxGLng
          AND r.scannedAt >= :cutoff
        """)
    List<ScannedRegion> findValidCellsInBox(
            int minGLat, int maxGLat,
            int minGLng, int maxGLng,
            LocalDateTime cutoff
    );

    /** All expired cells (for cleanup job) */
    List<ScannedRegion> findByScannedAtBefore(LocalDateTime cutoff);
}
package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Tracks geographic cells that have already been scanned from Goong API.
 * Grid cell size = SCAN_RADIUS_KM (40km), stored as integer grid coordinates.
 * Before calling the API, we check if the requested area is covered by existing cells.
 */
@Entity
@Table(name = "scanned_regions",
        indexes = {
                @Index(name = "idx_scanned_grid", columnList = "grid_lat,grid_lng"),
                @Index(name = "idx_scanned_at",   columnList = "scanned_at")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ScannedRegion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Integer grid coordinates — cell size = SCAN_CELL_KM degrees */
    @Column(name = "grid_lat", nullable = false)
    private Integer gridLat;

    @Column(name = "grid_lng", nullable = false)
    private Integer gridLng;

    /** Center lat/lng of this scan cell (stored for reference/debugging) */
    @Column(name = "center_lat", nullable = false)
    private Double centerLat;

    @Column(name = "center_lng", nullable = false)
    private Double centerLng;

    /** How many ATMs were found during the scan */
    @Column(name = "atm_count")
    private Integer atmCount;

    /** When this cell was last scanned — used for TTL refresh */
    @Column(name = "scanned_at", nullable = false)
    private LocalDateTime scannedAt;
}
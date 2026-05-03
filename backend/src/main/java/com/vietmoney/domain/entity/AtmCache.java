package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Cache ATM từ Goong API — unique theo placeId.
 * gridKey dùng để đánh dấu khu vực đã scan (tránh spam API).
 */
@Entity
@Table(name = "atm_cache", indexes = {
        @Index(name = "idx_atm_cache_place_id",  columnList = "place_id",  unique = true),
        @Index(name = "idx_atm_cache_grid_key",  columnList = "grid_key"),
        @Index(name = "idx_atm_cache_scanned_at", columnList = "scanned_at")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AtmCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "place_id", nullable = false, unique = true, length = 512)
    private String placeId;

    @Column(name = "name", length = 256)
    private String name;

    @Column(name = "address", length = 512)
    private String address;

    @Column(name = "lat")
    private Double lat;

    @Column(name = "lng")
    private Double lng;

    @Column(name = "bank_key", length = 64)
    private String bankKey;

    @Column(name = "type", length = 32)
    private String type;

    /** Grid cell key — format: "gridLat_gridLng" (0.01° steps) */
    @Column(name = "grid_key", length = 32)
    private String gridKey;

    /** Thời điểm lần cuối scan từ Goong */
    @Column(name = "scanned_at")
    private LocalDateTime scannedAt;
}
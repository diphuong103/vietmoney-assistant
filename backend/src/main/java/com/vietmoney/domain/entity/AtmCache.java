package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Cached ATM / bank branch data fetched from Goong API.
 * Once stored here, subsequent requests are served entirely from DB.
 */
@Entity
@Table(name = "atm_cache",
        indexes = {
                @Index(name = "idx_atm_place_id", columnList = "place_id", unique = true),
                @Index(name = "idx_atm_lat_lng",  columnList = "lat,lng"),
                @Index(name = "idx_atm_scanned",  columnList = "scanned_at")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AtmCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "place_id", length = 512)
    private String placeId;

    @Column(nullable = false, length = 512)
    private String name;

    @Column(length = 1024)
    private String address;

    @Column(precision = 10)
    private Double lat;

    @Column(precision = 10)
    private Double lng;

    /** Bank identifier key matching BANK_META on frontend */
    @Column(name = "bank_key", length = 64)
    private String bankKey;

    /** "Cây ATM" or "Ngân hàng" */
    @Column(length = 64)
    private String type;

    /** "open" / "closed" */
    @Column(length = 32)
    private String status;

    @Column(precision = 3)
    private Double rating;

    @Column(name = "phone", length = 32)
    private String phone;

    /** Grid cell key "lat_lng" for grouping */
    @Column(name = "grid_key", length = 64)
    private String gridKey;

    @Column(name = "scanned_at")
    private LocalDateTime scannedAt;
}
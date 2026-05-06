package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * MASTER DATA
 * Dùng cho:
 * - Price Wiki category
 * - Admin quản lý category
 * - Frontend filter pills
 */
@Entity
@Table(
        name = "price_categories",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_price_category_name", columnNames = "name")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 20)
    private String icon;

    @Column(length = 100)
    private String color;

    @Builder.Default
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();

        if (this.displayOrder == null) {
            this.displayOrder = 0;
        }

        if (this.active == null) {
            this.active = true;
        }
    }
}
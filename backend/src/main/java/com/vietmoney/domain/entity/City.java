package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cities",
        uniqueConstraints = @UniqueConstraint(columnNames = {"country_id", "normalized_name"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    @Column(nullable = false)
    private String name;

    @Column(name = "normalized_name", nullable = false)
    private String normalizedName;

    private String province;

    private Boolean isPopular = false;

    private Boolean active = true;

    private LocalDateTime createdAt;
}
package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "countries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Country {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; // VN, US

    @Column(nullable = false)
    private String name;

    @Column(name = "currency_code", nullable = false)
    private String currencyCode;

    private Boolean active = true;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "country")
    private List<City> cities;
}
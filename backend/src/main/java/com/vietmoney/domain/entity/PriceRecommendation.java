package com.vietmoney.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "price_recommendations")
@Getter
@Setter
public class PriceRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String city;

    private BigDecimal budgetMin;

    private BigDecimal budgetMax;

    @Column(columnDefinition = "TEXT")
    private String suggestion;
}
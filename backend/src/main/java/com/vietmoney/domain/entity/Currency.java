package com.vietmoney.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "currencies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Currency {

    @Id
    private String code;

    @Column(name = "rate_to_vnd", nullable = false)
    private BigDecimal rateToVnd;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
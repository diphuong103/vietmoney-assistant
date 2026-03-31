package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "budgets")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Budget {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String name;
    private BigDecimal totalAmount;
    private BigDecimal spentAmount = BigDecimal.ZERO;
    private String currency;
    private LocalDate startDate;
    private LocalDate endDate;
}

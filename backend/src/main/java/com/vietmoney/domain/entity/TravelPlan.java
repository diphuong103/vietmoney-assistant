// backend/src/main/java/com/vietmoney/domain/entity/TravelPlan.java
package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "travel_plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TravelPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    private String destination;
    private LocalDate startDate;
    private LocalDate endDate;
    private String budget;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Object itinerary;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private String currency;

    @Column(name = "number_of_people")
    private Integer numberOfPeople;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
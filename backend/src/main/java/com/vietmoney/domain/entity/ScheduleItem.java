package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "schedule_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ScheduleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "travel_plan_id", nullable = false)
    private TravelPlan travelPlan;

    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    @Column(name = "time_slot", nullable = false)
    private String timeSlot;      // "08:00"

    @Column(nullable = false)
    private String location;      // "Khách sạn Mường Thanh"

    @Column(columnDefinition = "TEXT")
    private String description;   // "Tìm 1 chỗ thuê để tối lại nghỉ chân"

    @Column(name = "estimated_cost")
    private String estimatedCost; // "5,000,000đ"

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
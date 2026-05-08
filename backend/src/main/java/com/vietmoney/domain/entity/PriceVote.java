package com.vietmoney.domain.entity;

import com.vietmoney.domain.enums.VoteType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "price_votes",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "report_id"})
)
@Getter
@Setter
public class PriceVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long reportId;

    @Enumerated(EnumType.STRING)
    private VoteType vote;

    private LocalDateTime createdAt = LocalDateTime.now();
}
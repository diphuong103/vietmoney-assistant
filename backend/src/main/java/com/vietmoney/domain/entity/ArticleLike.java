package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "article_likes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id", nullable = false)
    private Article article;
}

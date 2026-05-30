package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "saved_articles",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"article_id", "user_id"}
                )
        }
)
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SavedArticle {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id", nullable = false)
    private Article article;

    private String folder;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {

        createdAt = LocalDateTime.now();

        if (folder == null) {
            folder = "DEFAULT";
        }
    }
}

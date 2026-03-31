package com.vietmoney.domain.entity;

import com.vietmoney.domain.enums.ArticleStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "articles")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Article {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String thumbnailUrl;
    private String tags;

    @Enumerated(EnumType.STRING)
    private ArticleStatus status = ArticleStatus.PENDING;

    private String rejectionReason;
    private Long viewCount = 0L;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}

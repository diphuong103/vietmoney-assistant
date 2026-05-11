package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "article_media")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id")
    private Article article;

    private String mediaUrl;

    private String mediaType;

    private Long fileSize;

    private String mimeType;

    private Integer displayOrder;
}
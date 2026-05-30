package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "article_hashtags")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(ArticleHashtagId.class)
public class ArticleHashtag {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id")
    private Article article;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hashtag_id")
    private Hashtag hashtag;
}
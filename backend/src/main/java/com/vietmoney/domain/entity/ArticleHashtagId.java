package com.vietmoney.domain.entity;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ArticleHashtagId implements Serializable {

    private Long article;
    private Long hashtag;
}
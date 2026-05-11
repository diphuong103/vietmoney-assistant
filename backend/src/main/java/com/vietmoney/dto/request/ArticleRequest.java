package com.vietmoney.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class ArticleRequest {

    private String title;

    private String content;

    private String category;

    private String visibility;

    private String tags;

    private String status;

    private List<MediaRequest> media;
}
package com.vietmoney.dto.request;

import lombok.Data;

@Data
public class SearchRequest {

    private String keyword;

    private String category;

    private String location;

    private String hashtag;

    private String sort;
}
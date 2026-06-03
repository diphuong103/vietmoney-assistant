package com.vietmoney.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class ArticleRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    private String category;

    private String visibility;

    private String status;

    private Long touristSpotId;

    private Long travelPlanId;

    private Long cityPriceWikiId;

    private String location;

    private List<String> hashtags;

    @Valid
    private List<MediaRequest> media;
}
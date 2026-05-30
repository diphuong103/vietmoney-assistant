package com.vietmoney.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class ArticleRequest {

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

    private List<MediaRequest> media;
}
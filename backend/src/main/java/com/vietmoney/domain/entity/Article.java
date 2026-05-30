package com.vietmoney.domain.entity;

import com.vietmoney.domain.enums.ArticleCategory;
import com.vietmoney.domain.enums.ArticleStatus;
import com.vietmoney.domain.enums.ArticleVisibility;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "articles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id")
    private User author;

    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    private ArticleCategory category;

    //
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tourist_spot_id")
    private TouristSpot touristSpot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "travel_plan_id")
    private TravelPlan travelPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_price_wiki_id")
    private CityPriceWiki cityPriceWiki;
    //

    private String location;

    @Enumerated(EnumType.STRING)
    private ArticleVisibility visibility;

    @Enumerated(EnumType.STRING)
    private ArticleStatus status;


    private Boolean deleted;

    private Boolean isFeatured;

    private Boolean isEdited;

    private String rejectionReason;

    private Long likeCount;

    private Long saveCount;

    private Long commentCount;

    private Long shareCount;

    private Long viewCount;

    private LocalDateTime publishedAt;

    private LocalDateTime editedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(
            mappedBy = "article",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private List<ArticleMedia> mediaList = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (status == null) {
            status = ArticleStatus.DRAFT;
        }

        if (visibility == null) {
            visibility = ArticleVisibility.PUBLIC;
        }

        if (isFeatured == null) {
            isFeatured = false;
        }

        deleted = false;
        isEdited = false;
        likeCount = 0L;
        saveCount = 0L;
        commentCount = 0L;
        shareCount = 0L;
        viewCount = 0L;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
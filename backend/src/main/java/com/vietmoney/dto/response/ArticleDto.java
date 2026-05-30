package com.vietmoney.dto.response;

import com.vietmoney.domain.entity.Article;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class ArticleDto {

    private Long id;

    private String title;

    private String content;

    private String excerpt;

    private String category;

    private String status;

    private String visibility;

    private String location;

    // =====================================================
    // AUTHOR
    // =====================================================

    private Long authorId;

    private String authorName;

    private String authorAvatar;

    // =====================================================
    // COUNTS
    // =====================================================

    private Long viewCount;

    private Long likeCount;

    private Long saveCount;

    private Long commentCount;

    private Long shareCount;

    // =====================================================
    // FLAGS
    // =====================================================

    private Boolean isEdited;

    private Boolean isFeatured;

    // =====================================================
    // DATES
    // =====================================================

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime publishedAt;

    private LocalDateTime editedAt;

    // =====================================================
    // MEDIA
    // =====================================================

    private List<ArticleMediaDto> mediaList;

    private String mediaUrl;

    private String mediaType;

    // =====================================================
    // HASHTAGS
    // =====================================================

    private List<String> hashtags;

    // =====================================================
    // STATUS
    // =====================================================

    private Boolean liked;

    private Boolean saved;

    public static ArticleDto from(Article a) {

        List<ArticleMediaDto> media =
                (a.getMediaList() != null && !a.getMediaList().isEmpty())
                        ? a.getMediaList()
                        .stream()
                        .map(ArticleMediaDto::from)
                        .collect(Collectors.toList())
                        : Collections.emptyList();

        String firstMediaUrl =
                media.isEmpty()
                        ? null
                        : media.get(0).getMediaUrl();

        String firstMediaType =
                media.isEmpty()
                        ? null
                        : media.get(0).getMediaType();

        return ArticleDto.builder()
                .id(a.getId())
                .title(a.getTitle())
                .content(a.getContent())

                .excerpt(
                        a.getContent() != null &&
                                a.getContent().length() > 150
                                ? a.getContent().substring(0, 150) + "..."
                                : a.getContent()
                )

                .category(
                        a.getCategory() != null
                                ? a.getCategory().name()
                                : null
                )

                .status(
                        a.getStatus() != null
                                ? a.getStatus().name()
                                : null
                )

                .visibility(
                        a.getVisibility() != null
                                ? a.getVisibility().name()
                                : null
                )

                .location(a.getLocation())

                // AUTHOR
                .authorId(
                        a.getAuthor() != null
                                ? a.getAuthor().getId()
                                : null
                )

                .authorName(
                        a.getAuthor() != null
                                ? a.getAuthor().getFullName()
                                : null
                )

                .authorAvatar(
                        a.getAuthor() != null
                                ? a.getAuthor().getAvatarUrl()
                                : null
                )

                // COUNTS
                .viewCount(a.getViewCount())
                .likeCount(a.getLikeCount())
                .saveCount(a.getSaveCount())
                .commentCount(a.getCommentCount())
                .shareCount(a.getShareCount())

                // FLAGS
                .isEdited(a.getIsEdited())
                .isFeatured(a.getIsFeatured())

                // DATES
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .publishedAt(a.getPublishedAt())
                .editedAt(a.getEditedAt())

                // MEDIA
                .mediaList(media)
                .mediaUrl(firstMediaUrl)
                .mediaType(firstMediaType)
                .hashtags(Collections.emptyList())

                .build();
    }
}
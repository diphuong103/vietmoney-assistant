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
    private String tags;

    private String authorName;
    private String authorAvatar;

    private Long viewCount;
    private Long likeCount;
    private Long saveCount;
    private Long commentCount;
    private Long shareCount;

    private Boolean isEdited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;
    private LocalDateTime editedAt;

    // Media được eager-load trong transaction, map sang DTO an toàn
    private List<ArticleMediaDto> mediaList;

    // Lấy mediaUrl + mediaType của media đầu tiên lên top-level
    // để frontend dùng trực tiếp như cũ (n.mediaUrl, n.mediaType)
    private String mediaUrl;
    private String mediaType;

    public static ArticleDto from(Article a) {

        List<ArticleMediaDto> media = (a.getMediaList() != null && !a.getMediaList().isEmpty())
                ? a.getMediaList().stream()
                .map(ArticleMediaDto::from)
                .collect(Collectors.toList())
                : Collections.emptyList();

        String firstMediaUrl  = media.isEmpty() ? null : media.get(0).getMediaUrl();
        String firstMediaType = media.isEmpty() ? null : media.get(0).getMediaType();

        return ArticleDto.builder()
                .id(a.getId())
                .title(a.getTitle())
                .content(a.getContent())
                .category(a.getCategory() != null ? a.getCategory().name() : null)
                .status(a.getStatus() != null ? a.getStatus().name() : null)
                .tags(a.getTags())
                .authorName(a.getAuthor() != null ? a.getAuthor().getFullName() : null)
                .authorAvatar(a.getAuthor() != null ? a.getAuthor().getAvatarUrl() : null)
                .viewCount(a.getViewCount())
                .likeCount(a.getLikeCount())
                .saveCount(a.getSaveCount())
                .commentCount(a.getCommentCount())
                .shareCount(a.getShareCount())
                .isEdited(a.getIsEdited())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .publishedAt(a.getPublishedAt())
                .editedAt(a.getEditedAt())
                .mediaList(media)
                .mediaUrl(firstMediaUrl)
                .mediaType(firstMediaType)
                .build();
    }
}
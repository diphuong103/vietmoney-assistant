package com.vietmoney.dto.response;

import com.vietmoney.domain.entity.ArticleComment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Data
@Builder
public class ArticleCommentDto {

    private Long id;
    private String content;
    private Long articleId;
    private Long userId;
    private String username;
    private String userAvatar;
    private Long parentCommentId;
    private Long likeCount;
    private Boolean isEdited;
    private LocalDateTime createdAt;
    private List<ArticleCommentDto> replies;
    private Integer replyCount;
    private Boolean isAuthor;

    public static ArticleCommentDto from(ArticleComment c) {
        return from(c, null);
    }

    public static ArticleCommentDto from(ArticleComment c, Long articleAuthorId) {
        Long userId = c.getUser() != null ? c.getUser().getId() : null;
        boolean isAuthor = userId != null
                && articleAuthorId != null
                && userId.equals(articleAuthorId);

        return ArticleCommentDto.builder()
                .id(c.getId())
                .content(c.getContent())
                .articleId(c.getArticle() != null ? c.getArticle().getId() : null)
                .userId(userId)
                .username(c.getUser() != null ? c.getUser().getFullName() : null)
                .userAvatar(c.getUser() != null ? c.getUser().getAvatarUrl() : null)
                .parentCommentId(c.getParentComment() != null ? c.getParentComment().getId() : null)
                .likeCount(c.getLikeCount() != null ? c.getLikeCount() : 0L)
                .isEdited(c.getIsEdited() != null ? c.getIsEdited() : false)
                .createdAt(c.getCreatedAt())
                .replies(Collections.emptyList())
                .replyCount(0)
                .isAuthor(isAuthor)
                .build();
    }
}
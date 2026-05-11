package com.vietmoney.dto.response;

import com.vietmoney.domain.entity.ArticleMedia;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ArticleMediaDto {

    private Long id;
    private String mediaUrl;
    private String mediaType;
    private Long fileSize;
    private String mimeType;

    public static ArticleMediaDto from(ArticleMedia m) {
        return ArticleMediaDto.builder()
                .id(m.getId())
                .mediaUrl(m.getMediaUrl())
                .mediaType(m.getMediaType())
                .fileSize(m.getFileSize())
                .mimeType(m.getMimeType())
                .build();
    }
}
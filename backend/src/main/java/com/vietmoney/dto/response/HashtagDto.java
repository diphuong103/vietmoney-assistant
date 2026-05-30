package com.vietmoney.dto.response;

import com.vietmoney.domain.entity.Hashtag;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HashtagDto {

    private Long id;

    private String name;

    public static HashtagDto from(
            Hashtag hashtag
    ) {

        return HashtagDto.builder()
                .id(hashtag.getId())
                .name(hashtag.getName())
                .build();
    }
}
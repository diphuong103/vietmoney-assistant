package com.vietmoney.dto.request;

import lombok.Data;

@Data
public class MediaRequest {

    private String mediaUrl;

    private String mediaType;

    private Long fileSize;

    private String mimeType;
}
package com.vietmoney.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToggleSaveResponse {

    private boolean saved;

    private long saveCount;
}
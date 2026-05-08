package com.vietmoney.mapper;

import com.vietmoney.domain.entity.CityPriceWiki;
import com.vietmoney.dto.request.CreatePriceRequest;
import com.vietmoney.dto.response.PriceWikiResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface WikiPriceMapper {

    CityPriceWiki toEntity(CreatePriceRequest request);

    PriceWikiResponse toResponse(CityPriceWiki entity);
}
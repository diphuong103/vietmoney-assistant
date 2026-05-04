package com.vietmoney.controller;

import com.vietmoney.domain.entity.CityPriceWiki;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.service.WikiPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/price-wiki")
@RequiredArgsConstructor
public class WikiPriceController {

    private final WikiPriceService wikiPriceService;

    @GetMapping("/public/items")
    public ResponseEntity<ApiResponse<List<CityPriceWiki>>> getWikiPrices() {
        return ResponseEntity.ok(ApiResponse.success(wikiPriceService.getPrices()));
    }
}

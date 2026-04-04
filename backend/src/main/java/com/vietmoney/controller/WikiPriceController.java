package com.vietmoney.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/price-wiki")
public class WikiPriceController {

    // TODO: Inject WikiPriceService

    @GetMapping("/public/items")
    public ResponseEntity<?> getWikiPrices() {
        // TODO: Return prices list
        return ResponseEntity.ok().build();
    }
}

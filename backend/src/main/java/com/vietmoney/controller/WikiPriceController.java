package com.vietmoney.controller;

import com.vietmoney.dto.request.*;
import com.vietmoney.dto.response.PriceWikiResponse;
import com.vietmoney.service.WikiPriceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/wiki")
@RequiredArgsConstructor
public class WikiPriceController {

    private final WikiPriceService wikiService;

    // =====================================================
    // CLIENT - READ ONLY
    // =====================================================

    @GetMapping("/prices")
    public ResponseEntity<?> getPrices(
            @RequestParam String city,
            @RequestParam(defaultValue = "VND") String currency
    ) {
        List<PriceWikiResponse> data = wikiService.getPrices(city, currency);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", data
        ));
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getPublicCategories() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", wikiService.getCategories()
        ));
    }

    @GetMapping("/countries")
    public ResponseEntity<?> getCountries() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", wikiService.getCountries()
        ));
    }

    @GetMapping("/cities")
    public ResponseEntity<?> getCities(
            @RequestParam(required = false) Long countryId
    ) {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", wikiService.getCities(countryId)
        ));
    }

    @GetMapping("/currencies")
    public ResponseEntity<?> getCurrencies() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", wikiService.getCurrencies()
        ));
    }

    // =====================================================
    // ADMIN - CATEGORY MANAGEMENT
    // =====================================================

    @GetMapping("/admin/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getCategories() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", wikiService.getCategories()
        ));
    }

    @PostMapping("/admin/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCategory(
            @Valid @RequestBody CreatePriceCategoryRequest request
    ) {
        wikiService.createCategory(request);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Category created successfully"
        ));
    }

    @DeleteMapping("/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        wikiService.deleteCategory(id);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Category deleted successfully"
        ));
    }

    // =====================================================
    // ADMIN - UNIT MANAGEMENT
    // =====================================================

    @GetMapping("/admin/units")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUnits() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", wikiService.getUnits()
        ));
    }

    @PostMapping("/admin/units")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUnit(
            @Valid @RequestBody CreatePriceUnitRequest request
    ) {
        wikiService.createUnit(request);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Unit created successfully"
        ));
    }

    @DeleteMapping("/admin/units/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUnit(@PathVariable Long id) {
        wikiService.deleteUnit(id);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Unit deleted successfully"
        ));
    }

    // =====================================================
    // ADMIN - PRICE WIKI MANAGEMENT
    // =====================================================

    @PostMapping("/admin/prices")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createPrice(
            @Valid @RequestBody CreatePriceRequest request
    ) {
        wikiService.createPrice(request);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Price created successfully"
        ));
    }

    @DeleteMapping("/admin/prices/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deletePrice(@PathVariable Long id) {
        wikiService.deletePrice(id);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Price deleted successfully"
        ));
    }

    @PostMapping("/admin/countries")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCountry(@RequestBody @Valid CreateCountryRequest request) {
        wikiService.createCountry(request);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/admin/countries/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCountry(@PathVariable Long id) {
        wikiService.deleteCountry(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/admin/cities")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCity(@RequestBody @Valid CreateCityRequest request) {
        wikiService.createCity(request);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/admin/cities/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCity(@PathVariable Long id) {
        wikiService.deleteCity(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
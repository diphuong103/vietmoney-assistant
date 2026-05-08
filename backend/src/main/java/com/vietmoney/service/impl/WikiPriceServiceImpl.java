package com.vietmoney.service.impl;

import com.vietmoney.domain.entity.*;
import com.vietmoney.dto.request.*;
import com.vietmoney.dto.response.*;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.repository.*;
import com.vietmoney.service.WikiPriceService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WikiPriceServiceImpl implements WikiPriceService {

    private final CityPriceWikiRepository wikiRepo;
    private final CurrencyRepository currencyRepo;
    private final PriceCategoryRepository categoryRepo;
    private final PriceUnitRepository unitRepo;

    private final CountryRepository countryRepo;
    private final CityRepository cityRepo;

    // =====================================================
    // CLIENT
    // =====================================================

    @Override
    @Transactional(readOnly = true)
    public List<PriceWikiResponse> getPrices(String city, String currency) {

        List<CityPriceWiki> list = wikiRepo.findByCityIgnoreCase(city);

        if (list.isEmpty()) {
            return List.of();
        }

        BigDecimal rate = getCurrencyRate(currency);

        return list.stream().map(item -> {

            BigDecimal min = safe(item.getMinPrice());
            BigDecimal max = safe(item.getMaxPrice());

            return PriceWikiResponse.builder()
                    .id(item.getId())
                    .city(item.getCity())
                    .category(item.getCategoryRef().getName())
                    .item(item.getItem())
                    .minPrice(convert(min, rate))
                    .maxPrice(convert(max, rate))
                    .unit(item.getUnitRef().getName())
                    .note(item.getNote())
                    .build();

        }).toList();
    }

    @Override
    public List<Currency> getCurrencies() {
        return currencyRepo.findAll();
    }

    // =====================================================
    // CATEGORY
    // =====================================================

    @Override
    public List<PriceCategory> getCategories() {
        return categoryRepo.findByActiveTrueOrderByDisplayOrderAsc();
    }

    @Override
    public void createCategory(CreatePriceCategoryRequest request) {

        if (categoryRepo.existsByNameIgnoreCase(request.getName())) {
            throw new AppException(ErrorCode.CATEGORY_ALREADY_EXISTS);
        }

        PriceCategory category = PriceCategory.builder()
                .name(request.getName().trim())
                .icon(request.getIcon())
                .color(request.getColor())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .active(true)
                .build();

        categoryRepo.save(category);
    }

    @Override
    public void deleteCategory(Long id) {

        PriceCategory category = categoryRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        category.setActive(false);
        categoryRepo.save(category);
    }

    // =====================================================
    // UNIT
    // =====================================================

    @Override
    public List<PriceUnit> getUnits() {
        return unitRepo.findByActiveTrueOrderByDisplayOrderAsc();
    }

    @Override
    public void createUnit(CreatePriceUnitRequest request) {

        if (unitRepo.existsByNameIgnoreCase(request.getName())) {
            throw new AppException(ErrorCode.UNIT_ALREADY_EXISTS);
        }

        PriceUnit unit = PriceUnit.builder()
                .name(request.getName().trim())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .active(true)
                .build();

        unitRepo.save(unit);
    }

    @Override
    public void deleteUnit(Long id) {

        PriceUnit unit = unitRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.UNIT_NOT_FOUND));

        unit.setActive(false);
        unitRepo.save(unit);
    }

    // =====================================================
    // COUNTRY
    // =====================================================

    @Override
    public List<CountryResponse> getCountries() {
        return countryRepo.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(c -> CountryResponse.builder()
                        .id(c.getId())
                        .code(c.getCode())
                        .name(c.getName())
                        .currencyCode(c.getCurrencyCode())
                        .build())
                .toList();
    }

    @Override
    public void createCountry(CreateCountryRequest request) {

        if (countryRepo.existsByCodeIgnoreCase(request.getCode())) {
            throw new AppException(ErrorCode.COUNTRY_ALREADY_EXISTS);
        }

        Country country = Country.builder()
                .code(request.getCode().toUpperCase())
                .name(request.getName())
                .currencyCode(request.getCurrencyCode().toUpperCase())
                .active(true)
                .build();

        countryRepo.save(country);
    }

    @Override
    public void deleteCountry(Long id) {

        Country country = countryRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COUNTRY_NOT_FOUND));

        country.setActive(false);
        countryRepo.save(country);
    }

    // =====================================================
    // CITY
    // =====================================================

    @Override
    public List<CityResponse> getCities(Long countryId) {

        List<City> cities;

        if (countryId != null) {
            cities = cityRepo.findByCountryIdAndActiveTrue(countryId);
        } else {
            cities = cityRepo.findByActiveTrueOrderByNameAsc();
        }

        return cities.stream()
                .map(c -> CityResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .normalizedName(c.getNormalizedName())
                        .province(c.getProvince())
                        .isPopular(c.getIsPopular())
                        .countryName(c.getCountry().getName())
                        .build())
                .toList();
    }

    @Override
    public void createCity(CreateCityRequest request) {

        Country country = countryRepo.findById(request.getCountryId())
                .orElseThrow(() -> new AppException(ErrorCode.COUNTRY_NOT_FOUND));

        if (cityRepo.existsByCountryIdAndNormalizedName(
                request.getCountryId(),
                request.getNormalizedName()
        )) {
            throw new AppException(ErrorCode.CITY_ALREADY_EXISTS);
        }

        City city = City.builder()
                .country(country)
                .name(request.getName())
                .normalizedName(request.getNormalizedName())
                .province(request.getProvince())
                .isPopular(request.getIsPopular() != null && request.getIsPopular())
                .active(true)
                .build();

        cityRepo.save(city);
    }

    @Override
    public void deleteCity(Long id) {

        City city = cityRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CITY_NOT_FOUND));

        city.setActive(false);
        cityRepo.save(city);
    }

    // =====================================================
    // PRICE
    // =====================================================

    @Override
    public void createPrice(CreatePriceRequest request) {

        PriceCategory category = categoryRepo.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        PriceUnit unit = unitRepo.findById(request.getUnitId())
                .orElseThrow(() -> new AppException(ErrorCode.UNIT_NOT_FOUND));

        CityPriceWiki entity = CityPriceWiki.builder()
                .city(request.getCity()) // giữ backward
                .item(request.getItem())
                .minPrice(request.getMinPrice())
                .maxPrice(request.getMaxPrice())
                .note(request.getNote())
                .categoryRef(category)
                .unitRef(unit)
                .build();

        wikiRepo.save(entity);
    }

    @Override
    public void deletePrice(Long id) {

        if (!wikiRepo.existsById(id)) {
            throw new AppException(ErrorCode.WIKI_PRICE_NOT_FOUND);
        }

        wikiRepo.deleteById(id);
    }

    // =====================================================
    // PRIVATE
    // =====================================================

    private BigDecimal getCurrencyRate(String currency) {
        return currencyRepo.findById(currency.toUpperCase())
                .map(Currency::getRateToVnd)
                .filter(rate -> rate.compareTo(BigDecimal.ZERO) > 0)
                .orElse(BigDecimal.ONE);
    }

    private BigDecimal convert(BigDecimal price, BigDecimal rate) {
        if (rate.compareTo(BigDecimal.ZERO) <= 0) return price;
        return price.divide(rate, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
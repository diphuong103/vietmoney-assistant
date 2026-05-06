
package com.vietmoney.service;

import com.vietmoney.domain.entity.Currency;
import com.vietmoney.domain.entity.PriceCategory;
import com.vietmoney.domain.entity.PriceUnit;
import com.vietmoney.dto.request.*;
import com.vietmoney.dto.response.CityResponse;
import com.vietmoney.dto.response.CountryResponse;
import com.vietmoney.dto.response.PriceWikiResponse;

import java.util.List;

public interface WikiPriceService {

    // ================= CLIENT =================
    List<PriceWikiResponse> getPrices(String city, String currency);

    List<Currency> getCurrencies();

    // ================= ADMIN CATEGORY =================
    List<PriceCategory> getCategories();

    void createCategory(CreatePriceCategoryRequest request);

    void deleteCategory(Long id);

    // ================= ADMIN UNIT =================
    List<PriceUnit> getUnits();

    void createUnit(CreatePriceUnitRequest request);

    void deleteUnit(Long id);

    // ================= ADMIN PRICE =================
    void createPrice(CreatePriceRequest request);

    void deletePrice(Long id);

    // COUNTRY
    List<CountryResponse> getCountries();
    void createCountry(CreateCountryRequest request);
    void deleteCountry(Long id);

    // CITY
    List<CityResponse> getCities(Long countryId);
    void createCity(CreateCityRequest request);
    void deleteCity(Long id);
}
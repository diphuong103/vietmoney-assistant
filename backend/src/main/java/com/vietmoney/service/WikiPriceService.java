package com.vietmoney.service;

import com.vietmoney.domain.entity.CityPriceWiki;
import com.vietmoney.repository.CityPriceWikiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WikiPriceService {

    private final CityPriceWikiRepository cityPriceWikiRepository;

    public List<CityPriceWiki> getPrices() {
        return cityPriceWikiRepository.findAll();
    }
}

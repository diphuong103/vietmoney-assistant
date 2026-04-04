package com.vietmoney.service;

import com.vietmoney.domain.entity.TouristSpot;
import com.vietmoney.repository.TouristSpotRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TouristSpotService {

    private final TouristSpotRepository touristSpotRepository;

    public List<TouristSpot> getTouristSpots() {
        return touristSpotRepository.findAll();
    }

    public TouristSpot getSpotById(Long id) {
        return touristSpotRepository.findById(id).orElse(null);
    }
}

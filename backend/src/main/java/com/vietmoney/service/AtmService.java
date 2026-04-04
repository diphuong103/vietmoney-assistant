package com.vietmoney.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AtmService {

    public List<Object> getNearbyAtms(double lat, double lng, int radius) {
        List<Object> atms = new ArrayList<>();
        atms.add(Map.of("id", 1L, "name", "Vietcombank ATM", "lat", lat + 0.001, "lng", lng + 0.001));
        atms.add(Map.of("id", 2L, "name", "Techcombank ATM", "lat", lat - 0.002, "lng", lng + 0.001));
        return atms;
    }

    public Object getAtmById(Long id) {
        return Map.of("id", id, "name", "ATM Bank", "address", "Hanoi, Vietnam");
    }
}

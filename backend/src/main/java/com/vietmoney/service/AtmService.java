package com.vietmoney.service;

import org.springframework.stereotype.Service;

import com.vietmoney.domain.entity.SavedAtm;
import com.vietmoney.domain.entity.User;
import com.vietmoney.dto.request.SavedAtmRequest;
import com.vietmoney.repository.SavedAtmRepository;
import com.vietmoney.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AtmService {

    private final UserRepository userRepository;
    private final SavedAtmRepository savedAtmRepository;

    public List<Object> getNearbyAtms(double lat, double lng, int radius) {
        List<Object> atms = new ArrayList<>();
        atms.add(Map.of("id", 1L, "name", "Vietcombank ATM", "lat", lat + 0.001, "lng", lng + 0.001));
        atms.add(Map.of("id", 2L, "name", "Techcombank ATM", "lat", lat - 0.002, "lng", lng + 0.001));
        return atms;
    }

    public Object getAtmById(Long id) {
        return Map.of("id", id, "name", "ATM Bank", "address", "Hanoi, Vietnam");
    }

    @Transactional
    public Object saveAtm(String username, SavedAtmRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!savedAtmRepository.existsByUserAndAtmId(user, request.getAtmId())) {
            SavedAtm savedAtm = SavedAtm.builder()
                    .user(user)
                    .atmId(request.getAtmId())
                    .name(request.getName())
                    .address(request.getAddress())
                    .lat(request.getLat())
                    .lng(request.getLng())
                    .bankKey(request.getBankKey())
                    .build();
            savedAtmRepository.save(savedAtm);
        }
        return Map.of("success", true);
    }

    @Transactional
    public void unsaveAtm(String username, Long atmId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        savedAtmRepository.deleteByUserAndAtmId(user, atmId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSavedAtms(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return savedAtmRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(atm -> (Map<String, Object>) Map.<String, Object>of(
                        "id", atm.getAtmId(),
                        "name", atm.getName() != null ? atm.getName() : "",
                        "address", atm.getAddress() != null ? atm.getAddress() : "",
                        "lat", atm.getLat() != null ? atm.getLat() : 0.0,
                        "lng", atm.getLng() != null ? atm.getLng() : 0.0,
                        "bankKey", atm.getBankKey() != null ? atm.getBankKey() : "",
                        "saved", true))
                .collect(Collectors.toList());
    }
}

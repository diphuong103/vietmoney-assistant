package com.vietmoney.service;

import com.vietmoney.domain.entity.ScanHistory;
import com.vietmoney.repository.ScanHistoryRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScanService {

    private final ScanHistoryRepository scanHistoryRepository;

    public List<ScanHistory> getScanHistory(String username) {
        return scanHistoryRepository.findByUserUsernameOrderByScannedAtDesc(username);
    }

    public void deleteScanHistory(Long id) {
        scanHistoryRepository.deleteById(id);
    }
}

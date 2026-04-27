// THAY TOÀN BỘ file này
package com.vietmoney.service;

import com.vietmoney.domain.entity.ScanHistory;
import com.vietmoney.domain.entity.User;
import com.vietmoney.dto.response.ScanResultResponse;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.repository.ScanHistoryRepository;
import com.vietmoney.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScanService {

    private final ScanHistoryRepository scanHistoryRepository;
    private final UserRepository        userRepository;

    public List<ScanHistory> getScanHistory(String username) {
        return scanHistoryRepository.findByUserUsernameOrderByScannedAtDesc(username);
    }

    @Transactional
    public void deleteScanHistory(Long id) {
        if (!scanHistoryRepository.existsById(id)) {
            throw new AppException(ErrorCode.SCAN_NOT_FOUND);
        }
        scanHistoryRepository.deleteById(id);
    }

    @Transactional
    public ScanHistory saveScanResult(String username, ScanResultResponse result) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String label = Boolean.TRUE.equals(result.getIsFake())
                ? "[FAKE] " + result.getDenomination()
                : result.getDenomination();

        ScanHistory history = ScanHistory.builder()
                .user(user)
                .imageUrl(result.getImageUrl())
                .detectedDenomination(label)
                .confidence(result.getConfidence())
                .rawResult(String.format(
                        "{\"class\":\"%s\",\"currency\":\"%s\",\"authenticity\":\"%s\",\"valueVnd\":%s}",
                        result.getClassName(),
                        result.getCurrencyType(),
                        result.getAuthenticity(),
                        result.getValueVnd() != null ? result.getValueVnd() : "null"
                ))
                .build();

        ScanHistory saved = scanHistoryRepository.save(history);
        log.info("Saved scan id={} user={} class={}", saved.getId(), username, result.getClassName());
        return saved;
    }


    // Thêm method này, giữ nguyên các method cũ
    public List<ScanHistory> getScanHistoryDto(String username) {
        return scanHistoryRepository
                .findByUserUsernameOrderByScannedAtDesc(username)
                .stream()
                .map(h -> ScanHistory.builder()
                        .id(h.getId())
                        .detectedDenomination(h.getDetectedDenomination())
                        .confidence(h.getConfidence())
                        .imageUrl(h.getImageUrl())
                        .rawResult(h.getRawResult())
                        .scannedAt(h.getScannedAt())
                        .build())
                .toList();
    }
}
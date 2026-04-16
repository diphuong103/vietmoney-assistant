package com.vietmoney.repository;

import com.vietmoney.domain.entity.ScanHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScanHistoryRepository extends JpaRepository<ScanHistory, Long> {
    List<ScanHistory> findByUserUsernameOrderByScannedAtDesc(String username);

    long countByScannedAtAfter(LocalDateTime dateTime);
}

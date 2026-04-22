package com.vietmoney.repository;

import com.vietmoney.domain.entity.SavedAtm;
import com.vietmoney.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedAtmRepository extends JpaRepository<SavedAtm, Long> {

    List<SavedAtm> findByUserOrderByCreatedAtDesc(User user);

    Optional<SavedAtm> findByUserAndAtmId(User user, Long atmId);

    boolean existsByUserAndAtmId(User user, Long atmId);

    void deleteByUserAndAtmId(User user, Long atmId);
}

// backend/src/main/java/com/vietmoney/repository/TravelPlanRepository.java
package com.vietmoney.repository;

import com.vietmoney.domain.entity.TravelPlan;
import com.vietmoney.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TravelPlanRepository extends JpaRepository<TravelPlan, Long> {
    List<TravelPlan> findByUserOrderByCreatedAtDesc(User user);
    Optional<TravelPlan> findByIdAndUser(Long id, User user);
}
package com.vietmoney.service;

import com.vietmoney.domain.entity.TravelPlan;
import com.vietmoney.domain.entity.User;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.repository.TravelPlanRepository;
import com.vietmoney.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TravelPlanService {

    private final TravelPlanRepository travelPlanRepository;
    private final UserRepository userRepository;

    public List<TravelPlan> getUserPlans(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return travelPlanRepository.findAll().stream()
                .filter(p -> p.getUser().getId().equals(user.getId()))
                .toList();
    }

    @Transactional
    public TravelPlan createPlan(String username, TravelPlan plan) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        plan.setUser(user);
        return travelPlanRepository.save(plan);
    }

    @Transactional
    public void deletePlan(Long id) {
        if (!travelPlanRepository.existsById(id)) {
            throw new AppException(ErrorCode.BUDGET_NOT_FOUND);
        }
        travelPlanRepository.deleteById(id);
    }
}

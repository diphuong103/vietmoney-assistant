package com.vietmoney.service;

import com.vietmoney.domain.entity.TravelPlan;
import com.vietmoney.domain.entity.User;
import com.vietmoney.dto.request.TravelPlanRequest;
import com.vietmoney.dto.response.TravelPlanResponse;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.mapper.TravelPlanMapper;
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
    private final TravelPlanMapper travelPlanMapper;

    public List<TravelPlanResponse> getUserPlans(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return travelPlanRepository.findByUserId(user.getId()).stream()
                .map(travelPlanMapper::toResponse)
                .toList();
    }

    @Transactional
    public TravelPlanResponse createPlan(String username, TravelPlanRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        TravelPlan plan = travelPlanMapper.toEntity(request);
        plan.setUser(user);
        return travelPlanMapper.toResponse(travelPlanRepository.save(plan));
    }

    @Transactional
    public TravelPlanResponse updatePlan(Long id, String username, TravelPlanRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        TravelPlan plan = travelPlanRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));
        if (!plan.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        travelPlanMapper.updateEntity(plan, request);
        return travelPlanMapper.toResponse(travelPlanRepository.save(plan));
    }

    @Transactional
    public void deletePlan(Long id) {
        if (!travelPlanRepository.existsById(id)) {
            throw new AppException(ErrorCode.BUDGET_NOT_FOUND);
        }
        travelPlanRepository.deleteById(id);
    }
}

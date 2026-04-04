package com.vietmoney.service;

import com.vietmoney.domain.entity.Budget;
import com.vietmoney.domain.entity.User;
import com.vietmoney.dto.request.BudgetRequest;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.repository.BudgetRepository;
import com.vietmoney.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;

    public List<Budget> getUserBudgets(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return budgetRepository.findAll().stream()
                .filter(b -> b.getUser().getId().equals(user.getId()))
                .toList();
    }

    @Transactional
    public Budget createBudget(String username, BudgetRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Budget budget = Budget.builder()
                .user(user)
                .name(request.getName())
                .totalAmount(request.getTotalAmount())
                .currency(request.getCurrency())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();
        return budgetRepository.save(budget);
    }

    @Transactional
    public Budget updateBudget(Long id, BudgetRequest request) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));
        budget.setName(request.getName());
        budget.setTotalAmount(request.getTotalAmount());
        budget.setCurrency(request.getCurrency());
        return budgetRepository.save(budget);
    }

    @Transactional
    public void deleteBudget(Long id) {
        if (!budgetRepository.existsById(id))
            throw new AppException(ErrorCode.BUDGET_NOT_FOUND);
        budgetRepository.deleteById(id);
    }

    @Transactional
    public Budget getDailyBudget(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return budgetRepository.findAll().stream()
                .filter(b -> b.getUser().getId().equals(user.getId()) && "Daily Budget".equals(b.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Budget b = Budget.builder()
                        .user(user)
                        .name("Daily Budget")
                        .totalAmount(java.math.BigDecimal.ZERO)
                        .currency("VND")
                        .build();
                    return budgetRepository.save(b);
                });
    }

    @Transactional
    public Budget setDailyBudget(String username, java.math.BigDecimal amount) {
        Budget b = getDailyBudget(username);
        b.setTotalAmount(amount);
        return budgetRepository.save(b);
    }
}

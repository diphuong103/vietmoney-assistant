package com.vietmoney.service.impl;

import com.vietmoney.domain.entity.Budget;
import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.CategoryType;
import com.vietmoney.domain.enums.TransactionType;
import com.vietmoney.dto.request.BudgetRequest;
import com.vietmoney.dto.response.BudgetResponse;
import com.vietmoney.dto.response.DailyBudgetResponse;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.mapper.BudgetMapper;
import com.vietmoney.repository.BudgetRepository;
import com.vietmoney.repository.TransactionRepository;
import com.vietmoney.repository.UserRepository;
import com.vietmoney.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final BudgetMapper budgetMapper;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    // ================= CURRENT USER =================
    private User getCurrentUser() {
        String username = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    // ================= CREATE =================
    @Override
    public BudgetResponse create(BudgetRequest request) {
        validateBudgetRequest(request);

        User user = getCurrentUser();

        Budget budget = budgetMapper.toEntity(request);
        budget.setUser(user);

        // đảm bảo không null
        if (budget.getSpentAmount() == null) {
            budget.setSpentAmount(BigDecimal.ZERO);
        }

        Budget saved = budgetRepository.save(budget);

        return mapPercent(saved);
    }

    // ================= GET ALL MY BUDGETS =================
    @Override
    public List<BudgetResponse> getMyBudgets() {
        return budgetRepository
                .findByUserIdOrderByCreatedAtDesc(getCurrentUser().getId())
                .stream()
                .map(this::mapPercent)
                .toList();
    }

    // ================= UPDATE =================
    @Override
    public BudgetResponse update(Long id, BudgetRequest request) {
        validateBudgetRequest(request);

        Budget budget = budgetRepository
                .findByIdAndUserId(id, getCurrentUser().getId())
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));

        budget.setName(request.getName());
        budget.setTotalAmount(request.getTotalAmount());
        budget.setCurrency(request.getCurrency());
        budget.setStartDate(request.getStartDate());
        budget.setEndDate(request.getEndDate());

        Budget updated = budgetRepository.save(budget);

        return mapPercent(updated);
    }

    // ================= DELETE =================
    @Override
    public void delete(Long id) {
        Budget budget = budgetRepository
                .findByIdAndUserId(id, getCurrentUser().getId())
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));

        budgetRepository.delete(budget);
    }

    // ================= DAILY BUDGET =================
    @Override
    public DailyBudgetResponse getDailyBudget() {
        User user = getCurrentUser();
        LocalDate today = LocalDate.now();

        Budget activeBudget = budgetRepository
                .findFirstByUserIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        user.getId(),
                        today,
                        today)
                .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));

        // số ngày budget
        long totalDays = ChronoUnit.DAYS.between(
                activeBudget.getStartDate(),
                activeBudget.getEndDate()) + 1;

        if (totalDays <= 0) {
            throw new AppException(ErrorCode.INVALID_DATE_RANGE);
        }

        // daily limit
        BigDecimal dailyLimit = activeBudget.getTotalAmount()
                .divide(BigDecimal.valueOf(totalDays), 2, RoundingMode.HALF_UP);

        // spent today
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        BigDecimal spentToday = transactionRepository.sumTodayByUserAndType(
                user.getId(),
                TransactionType.EXPENSE,
                startOfDay,
                endOfDay);

        if (spentToday == null) {
            spentToday = BigDecimal.ZERO;
        }

        // remaining
        BigDecimal remaining = dailyLimit.subtract(spentToday);

        // cho phép âm nếu vượt ngân sách
        // nếu muốn chặn âm thì:
        // remaining = remaining.max(BigDecimal.ZERO);

        // percent
        double percentUsed = 0;
        if (dailyLimit.compareTo(BigDecimal.ZERO) > 0) {
            percentUsed = spentToday
                    .divide(dailyLimit, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        return DailyBudgetResponse.builder()
                .dailyLimit(dailyLimit)
                .spentToday(spentToday)
                .remaining(remaining)
                .percentUsed(percentUsed)
                .build();
    }

    // ================= VALIDATION =================
    private void validateBudgetRequest(BudgetRequest request) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_BUDGET_NAME);
        }

        if (request.getTotalAmount() == null ||
                request.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_BUDGET_AMOUNT);
        }

        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new AppException(ErrorCode.INVALID_DATE_RANGE);
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new AppException(ErrorCode.INVALID_DATE_RANGE);
        }

        if (request.getCurrency() == null || request.getCurrency().trim().isEmpty()) {
            request.setCurrency("VND");
        }
    }

    // ================= MAPPER + PERCENT =================
    private BudgetResponse mapPercent(Budget budget) {
        BigDecimal spent = budget.getSpentAmount() == null
                ? BigDecimal.ZERO
                : budget.getSpentAmount();

        BigDecimal total = budget.getTotalAmount() == null
                ? BigDecimal.ZERO
                : budget.getTotalAmount();

        double percent = 0;

        if (total.compareTo(BigDecimal.ZERO) > 0) {
            percent = spent
                    .divide(total, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        BudgetResponse response = budgetMapper.toResponse(budget);
        response.setPercentUsed(percent);

        return response;
    }
}
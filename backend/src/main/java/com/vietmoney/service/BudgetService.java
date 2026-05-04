package com.vietmoney.service;

import com.vietmoney.dto.request.BudgetRequest;
import com.vietmoney.dto.response.BudgetResponse;
import com.vietmoney.dto.response.DailyBudgetResponse;

import java.util.List;

public interface BudgetService {

    BudgetResponse create(BudgetRequest request);

    List<BudgetResponse> getMyBudgets();

    BudgetResponse update(Long id, BudgetRequest request);

    void delete(Long id);

    DailyBudgetResponse getDailyBudget();
}
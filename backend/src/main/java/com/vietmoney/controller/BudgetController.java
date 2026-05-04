package com.vietmoney.controller;

import com.vietmoney.domain.entity.Budget;
import com.vietmoney.dto.request.BudgetRequest;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.dto.response.BudgetResponse;
import com.vietmoney.dto.response.DailyBudgetResponse;
import com.vietmoney.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    public BudgetResponse create(@RequestBody BudgetRequest request) {
        return budgetService.create(request);
    }

    @GetMapping
    public List<BudgetResponse> getMyBudgets() {
        return budgetService.getMyBudgets();
    }

    @PutMapping("/{id}")
    public BudgetResponse update(@PathVariable Long id,
                                 @RequestBody BudgetRequest request) {
        return budgetService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        budgetService.delete(id);
    }

    @GetMapping("/daily")
    public ResponseEntity<DailyBudgetResponse> getDailyBudget() {
        return ResponseEntity.ok(budgetService.getDailyBudget());
    }
}
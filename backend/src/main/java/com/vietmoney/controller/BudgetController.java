package com.vietmoney.controller;

import com.vietmoney.domain.entity.Budget;
import com.vietmoney.dto.request.BudgetRequest;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Budget>>> getMyBudgets(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getUserBudgets(userDetails.getUsername())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Budget>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tạo ngân sách thành công",
                budgetService.createBudget(userDetails.getUsername(), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Budget>> update(@PathVariable Long id,
            @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(ApiResponse.success(budgetService.updateBudget(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
    }
}

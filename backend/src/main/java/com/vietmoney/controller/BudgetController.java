package com.vietmoney.controller;

import com.vietmoney.dto.request.BudgetRequest;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.dto.response.BudgetResponse;
import com.vietmoney.dto.response.DailyBudgetResponse;
import com.vietmoney.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> create(@RequestBody BudgetRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tạo ngân sách thành công", budgetService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getMyBudgets() {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getMyBudgets()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>> update(@PathVariable Long id,
            @RequestBody BudgetRequest request) {
        return ResponseEntity
                .ok(ApiResponse.success("Cập nhật ngân sách thành công", budgetService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        budgetService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa ngân sách thành công", null));
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<DailyBudgetResponse>> getDailyBudget() {
        return ResponseEntity.ok(ApiResponse.success(budgetService.getDailyBudget()));
    }
}
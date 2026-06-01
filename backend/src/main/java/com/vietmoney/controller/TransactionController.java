package com.vietmoney.controller;

import com.vietmoney.dto.request.TransactionRequest;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.dto.response.TransactionResponse;
import com.vietmoney.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> create(@RequestBody TransactionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tạo giao dịch thành công", transactionService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getMyTransactions() {
        return ResponseEntity.ok(ApiResponse.success(transactionService.getMyTransactions()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> update(
            @PathVariable Long id,
            @RequestBody TransactionRequest request) {
        return ResponseEntity
                .ok(ApiResponse.success("Cập nhật giao dịch thành công", transactionService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        transactionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa giao dịch thành công", null));
    }
}
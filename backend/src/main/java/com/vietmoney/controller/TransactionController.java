package com.vietmoney.controller;

import com.vietmoney.dto.request.TransactionRequest;
import com.vietmoney.dto.response.TransactionResponse;
import com.vietmoney.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public TransactionResponse create(@RequestBody TransactionRequest request) {
        return transactionService.create(request);
    }

    @GetMapping
    public List<TransactionResponse> getMyTransactions() {
        return transactionService.getMyTransactions();
    }

    @PutMapping("/{id}")
    public TransactionResponse update(
            @PathVariable Long id,
            @RequestBody TransactionRequest request) {
        return transactionService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        transactionService.delete(id);
    }
}
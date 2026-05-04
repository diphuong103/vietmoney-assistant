package com.vietmoney.service;

import com.vietmoney.dto.request.TransactionRequest;
import com.vietmoney.dto.response.TransactionResponse;

import java.util.List;

public interface TransactionService {
    TransactionResponse create(TransactionRequest request);
    List<TransactionResponse> getMyTransactions();

    TransactionResponse update(Long id, TransactionRequest request);

    void delete(Long id);
}
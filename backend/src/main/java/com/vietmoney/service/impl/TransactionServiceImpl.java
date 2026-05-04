package com.vietmoney.service.impl;

import com.vietmoney.domain.entity.*;
import com.vietmoney.domain.enums.CategoryType;
import com.vietmoney.domain.enums.TransactionType;
import com.vietmoney.dto.request.TransactionRequest;
import com.vietmoney.dto.response.TransactionResponse;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.repository.*;
import com.vietmoney.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetRepository budgetRepository;

    // ================= USER =================
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    // ================= CREATE =================
    @Override
    public TransactionResponse create(TransactionRequest request) {
        User user = getCurrentUser();

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        }

        Budget budget = null;
        if (request.getBudgetId() != null) {
            budget = budgetRepository.findById(request.getBudgetId())
                    .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));
        }

        Transaction txn = Transaction.builder()
                .user(user)
                .category(category)
                .budget(budget)
                .type(request.getType())
                .amount(request.getAmount())
                .note(request.getNote())
                .build();

        Transaction saved = transactionRepository.save(txn);

        if (budget != null && request.getType() == TransactionType.EXPENSE) {
            if (budget.getSpentAmount() == null) {
                budget.setSpentAmount(BigDecimal.ZERO);
            }

            budget.setSpentAmount(
                    budget.getSpentAmount().add(request.getAmount()));
            budgetRepository.save(budget);
        }

        // ✅ reload để tránh lazy bug
        Transaction full = transactionRepository.findByIdWithCategory(saved.getId())
                .orElse(saved);

        return map(full);
    }

    // ================= GET ALL =================
    @Override
    public List<TransactionResponse> getMyTransactions() {
        return transactionRepository
                .findByUserIdOrderByCreatedAtDesc(getCurrentUser().getId())
                .stream()
                .map(this::map)
                .toList();
    }

    // ================= UPDATE =================
    @Override
    public TransactionResponse update(Long id, TransactionRequest request) {
        User user = getCurrentUser();

        Transaction txn = transactionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        if (!txn.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (txn.getBudget() != null && txn.getType() == TransactionType.EXPENSE) {
            Budget oldBudget = txn.getBudget();
            oldBudget.setSpentAmount(
                    oldBudget.getSpentAmount().subtract(txn.getAmount()));
            budgetRepository.save(oldBudget);
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        }

        Budget budget = null;
        if (request.getBudgetId() != null) {
            budget = budgetRepository.findById(request.getBudgetId())
                    .orElseThrow(() -> new AppException(ErrorCode.BUDGET_NOT_FOUND));
        }

        txn.setType(request.getType());
        txn.setAmount(request.getAmount());
        txn.setNote(request.getNote());
        txn.setCategory(category);
        txn.setBudget(budget);

        Transaction saved = transactionRepository.save(txn);

        if (budget != null && request.getType() == TransactionType.EXPENSE) {
            budget.setSpentAmount(
                    (budget.getSpentAmount() == null ? BigDecimal.ZERO : budget.getSpentAmount())
                            .add(request.getAmount()));
            budgetRepository.save(budget);
        }

        Transaction full = transactionRepository.findByIdWithCategory(saved.getId())
                .orElse(saved);

        return map(full);
    }

    // ================= DELETE =================
    @Override
    public void delete(Long id) {
        Transaction txn = transactionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        transactionRepository.delete(txn);
    }

    // ================= MAPPER =================
    private TransactionResponse map(Transaction t) {
        TransactionResponse res = new TransactionResponse();

        res.setId(t.getId());
        res.setAmount(t.getAmount());
        res.setType(t.getType().name());
        res.setNote(t.getNote());
        res.setCreatedAt(t.getCreatedAt());

        if (t.getCategory() != null) {
            res.setCategoryId(t.getCategory().getId());
            res.setCategoryName(t.getCategory().getName());
            res.setCategoryIcon(t.getCategory().getIcon());
            res.setCategoryColor(t.getCategory().getColor());
        }

        return res;
    }
}
package com.vietmoney.service.impl;

import com.vietmoney.domain.entity.*;
import com.vietmoney.domain.enums.CategoryType;
import com.vietmoney.domain.enums.NotificationType;
import com.vietmoney.dto.request.TransactionRequest;
import com.vietmoney.dto.response.TransactionResponse;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.repository.*;
import com.vietmoney.service.NotificationService;
import com.vietmoney.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final NotificationService notificationService;

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

        if (budget != null && request.getType() == CategoryType.EXPENSE) {
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

        TransactionResponse response = map(full);

        // ─ Notification: transaction created ─
        String catName = response.getCategoryName() != null ? " – " + response.getCategoryName() : "";
        String amtFmt = String.format("%,.0f₫", request.getAmount());
        notificationService.sendTo(
                user,
                NotificationType.TRANSACTION_CREATED,
                request.getType() == CategoryType.EXPENSE ? "Chi tiêu mới" : "Thu nhập mới",
                (request.getType() == CategoryType.EXPENSE ? "Chi " : "Thu ") + amtFmt + catName,
                "/budget");

        // ─ Notification: budget threshold ─
        if (budget != null && request.getType() == CategoryType.EXPENSE
                && budget.getTotalAmount() != null && budget.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal pct = budget.getSpentAmount()
                    .divide(budget.getTotalAmount(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

            if (pct.compareTo(BigDecimal.valueOf(100)) >= 0) {
                notificationService.sendTo(
                        user,
                        NotificationType.BUDGET_EXCEEDED,
                        "Vượt ngân sách!",
                        "Ngân sách \"" + budget.getName() + "\" đã vượt mức cho phép.",
                        "/budget");
            } else if (pct.compareTo(BigDecimal.valueOf(80)) >= 0) {
                notificationService.sendTo(
                        user,
                        NotificationType.BUDGET_WARNING,
                        "Sắp hết ngân sách",
                        "Bạn đã dùng " + pct.setScale(0, RoundingMode.HALF_UP) + "% ngân sách \"" + budget.getName()
                                + "\".",
                        "/budget");
            }
        }

        return response;
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

        if (txn.getBudget() != null && txn.getType() == CategoryType.EXPENSE) {
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

        if (budget != null && request.getType() == CategoryType.EXPENSE) {
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
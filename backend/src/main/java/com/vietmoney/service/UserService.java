package com.vietmoney.service;

import com.vietmoney.domain.entity.ArticleMedia;
import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.Role;
import com.vietmoney.repository.*;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TravelPlanRepository travelPlanRepository;
    private final NotificationRepository notificationRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final ArticleRepository articleRepository;
    private final SavedArticleRepository savedArticleRepository;
    private final ArticleMediaRepository articleMediaRepository;


    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public Page<User> getAllUsers(int page, int size) {
        return userRepository.findAll(PageRequest.of(page, size));
    }

    public void updateUserRole(Long id, String role) {
        User user = getUserById(id);
        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        user.setRole(Role.valueOf(role.toUpperCase()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = getUserById(id);

        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }


        savedArticleRepository.deleteByUserId(id);
        savedArticleRepository.deleteByArticleAuthorId(id);
        articleMediaRepository.deleteByArticleAuthorId(id);


        notificationRepository.deleteByUserId(id);
        transactionRepository.deleteByUserId(id);
        budgetRepository.deleteByUserId(id);
        travelPlanRepository.deleteByUserId(id);

        articleRepository.deleteByAuthorId(id);


        userRepository.deleteById(id);

        userRepository.deleteById(id);
    }

    public void toggleUserStatus(Long id) {
        User user = getUserById(id);
        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
    }
}

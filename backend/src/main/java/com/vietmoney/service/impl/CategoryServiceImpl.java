package com.vietmoney.service.impl;

import com.vietmoney.domain.entity.Category;
import com.vietmoney.domain.entity.User;
import com.vietmoney.domain.enums.CategoryType;
import com.vietmoney.dto.request.CategoryRequest;
import com.vietmoney.dto.response.CategoryResponse;
import com.vietmoney.exception.AppException;
import com.vietmoney.exception.ErrorCode;
import com.vietmoney.mapper.CategoryMapper;
import com.vietmoney.repository.CategoryRepository;
import com.vietmoney.repository.UserRepository;
import com.vietmoney.service.CategoryService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    public CategoryResponse createCategory(CategoryRequest request) {
        User user = getCurrentUser();

        if (categoryRepository.existsByUserIdAndNameIgnoreCaseAndType(
                user.getId(), request.getName(), request.getType())) {
            throw new AppException(ErrorCode.CATEGORY_ALREADY_EXISTS);
        }

        Category category = categoryMapper.toEntity(request);
        category.setUser(user);

        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getMyCategories() {
        return categoryMapper.toResponseList(
                categoryRepository.findByUserIdOrderByCreatedAtDesc(getCurrentUser().getId())
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getMyCategoriesByType(CategoryType type) {
        return categoryMapper.toResponseList(
                categoryRepository.findByUserIdAndTypeOrderByCreatedAtDesc(
                        getCurrentUser().getId(), type
                )
        );
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        User user = getCurrentUser();

        Category category = categoryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        category.setName(request.getName());
        category.setType(request.getType());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());

        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    public void deleteCategory(Long id) {
        User user = getCurrentUser();

        Category category = categoryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        if (Boolean.TRUE.equals(category.getIsDefault())) {
            throw new AppException(ErrorCode.DEFAULT_CATEGORY_CANNOT_DELETE);
        }

        categoryRepository.delete(category);
    }
}
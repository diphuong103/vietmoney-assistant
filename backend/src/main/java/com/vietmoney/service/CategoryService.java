package com.vietmoney.service;

import com.vietmoney.domain.enums.CategoryType;
import com.vietmoney.dto.request.CategoryRequest;
import com.vietmoney.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {

    CategoryResponse createCategory(CategoryRequest request);

    List<CategoryResponse> getMyCategories();

    List<CategoryResponse> getMyCategoriesByType(CategoryType type);

    CategoryResponse updateCategory(Long id, CategoryRequest request);

    void deleteCategory(Long id);
}
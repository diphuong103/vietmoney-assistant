package com.vietmoney.controller;

import com.vietmoney.domain.enums.CategoryType;
import com.vietmoney.dto.request.CategoryRequest;
import com.vietmoney.dto.response.ApiResponse;
import com.vietmoney.dto.response.CategoryResponse;
import com.vietmoney.service.CategoryService;

import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Category")
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ApiResponse<CategoryResponse> create(
            @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.success(categoryService.createCategory(request));
    }

    @GetMapping
    public ApiResponse<List<CategoryResponse>> getAll(
            @RequestParam(required = false) CategoryType type) {

        if (type != null) {
            return ApiResponse.success(categoryService.getMyCategoriesByType(type));
        }

        return ApiResponse.success(categoryService.getMyCategories());
    }

    @PutMapping("/{id}")
    public ApiResponse<CategoryResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.success(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> delete(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ApiResponse.success("Deleted successfully");
    }
}
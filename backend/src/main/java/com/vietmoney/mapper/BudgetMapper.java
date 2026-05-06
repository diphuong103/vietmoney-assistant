package com.vietmoney.mapper;

import com.vietmoney.domain.entity.Budget;
import com.vietmoney.dto.request.BudgetRequest;
import com.vietmoney.dto.response.BudgetResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BudgetMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "spentAmount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Budget toEntity(BudgetRequest request);

    @Mapping(target = "percentUsed", ignore = true)
    BudgetResponse toResponse(Budget budget);

    List<BudgetResponse> toResponseList(List<Budget> budgets);
}
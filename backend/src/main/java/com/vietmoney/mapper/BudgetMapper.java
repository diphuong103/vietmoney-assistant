package com.vietmoney.mapper;

import com.vietmoney.domain.entity.Budget;
import com.vietmoney.dto.request.BudgetRequest;
import com.vietmoney.dto.response.BudgetResponse;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BudgetMapper {

    Budget toEntity(BudgetRequest request);

    BudgetResponse toResponse(Budget budget);

    List<BudgetResponse> toResponseList(List<Budget> budgets);
}
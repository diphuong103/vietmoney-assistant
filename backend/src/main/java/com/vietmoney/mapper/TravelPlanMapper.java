package com.vietmoney.mapper;

import com.vietmoney.domain.entity.TravelPlan;
import com.vietmoney.dto.request.TravelPlanRequest;
import com.vietmoney.dto.response.TravelPlanResponse;
import org.springframework.stereotype.Component;

@Component
public class TravelPlanMapper {

    public TravelPlan toEntity(TravelPlanRequest request) {
        return TravelPlan.builder()
                .title(request.getTitle())
                .destination(request.getDestination())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .budget(request.getBudget())
                .currency(request.getCurrency())
                .numberOfPeople(request.getNumberOfPeople())
                .itinerary(request.getItinerary())
                .build();
    }

    public void updateEntity(TravelPlan entity, TravelPlanRequest request) {
        entity.setTitle(request.getTitle());
        entity.setDestination(request.getDestination());
        entity.setStartDate(request.getStartDate());
        entity.setEndDate(request.getEndDate());
        entity.setBudget(request.getBudget());
        entity.setCurrency(request.getCurrency());
        entity.setNumberOfPeople(request.getNumberOfPeople());
        entity.setItinerary(request.getItinerary());
    }

    public TravelPlanResponse toResponse(TravelPlan entity) {
        return TravelPlanResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .destination(entity.getDestination())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .budget(entity.getBudget())
                .currency(entity.getCurrency())
                .numberOfPeople(entity.getNumberOfPeople())
                .itinerary(entity.getItinerary())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}

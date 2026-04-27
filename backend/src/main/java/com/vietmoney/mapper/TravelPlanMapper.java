package com.vietmoney.mapper;

import com.vietmoney.domain.entity.TravelPlan;
import com.vietmoney.dto.request.TravelPlanRequest;
import com.vietmoney.dto.response.TravelPlanResponse;
import org.springframework.stereotype.Component;

@Component
public class TravelPlanMapper {

    public TravelPlanResponse toResponse(TravelPlan plan) {
        if (plan == null) return null;
        TravelPlanResponse res = new TravelPlanResponse();
        res.setId(plan.getId());
        res.setTitle(plan.getTitle());
        res.setDestination(plan.getDestination());
        res.setStartDate(plan.getStartDate());
        res.setEndDate(plan.getEndDate());
        res.setBudget(plan.getBudget());
        res.setCurrency(plan.getCurrency());
        res.setNumberOfPeople(plan.getNumberOfPeople());
        res.setItinerary(plan.getItinerary());
        res.setCreatedAt(plan.getCreatedAt());
        return res;
    }

    public TravelPlan toEntity(TravelPlanRequest req) {
        if (req == null) return null;
        TravelPlan plan = new TravelPlan();
        plan.setTitle(req.getTitle());
        plan.setDestination(req.getDestination());
        plan.setStartDate(req.getStartDate());
        plan.setEndDate(req.getEndDate());
        plan.setBudget(req.getBudget());
        plan.setCurrency(req.getCurrency());
        plan.setNumberOfPeople(req.getNumberOfPeople());
        plan.setItinerary(req.getItinerary());
        return plan;
    }

    public void updateEntity(TravelPlanRequest req, TravelPlan plan) {
        if (req == null || plan == null) return;
        if (req.getTitle() != null)        plan.setTitle(req.getTitle());
        if (req.getDestination() != null)  plan.setDestination(req.getDestination());
        if (req.getStartDate() != null)    plan.setStartDate(req.getStartDate());
        if (req.getEndDate() != null)      plan.setEndDate(req.getEndDate());
        if (req.getBudget() != null)       plan.setBudget(req.getBudget());
        if (req.getCurrency() != null)     plan.setCurrency(req.getCurrency());
        if (req.getNumberOfPeople() != null) plan.setNumberOfPeople(req.getNumberOfPeople());
        if (req.getItinerary() != null)    plan.setItinerary(req.getItinerary());
    }
}
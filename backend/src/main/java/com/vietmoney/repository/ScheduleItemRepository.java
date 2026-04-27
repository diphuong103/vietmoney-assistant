package com.vietmoney.repository;

import com.vietmoney.domain.entity.ScheduleItem;
import com.vietmoney.domain.entity.TravelPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ScheduleItemRepository extends JpaRepository<ScheduleItem, Long> {
    List<ScheduleItem> findByTravelPlanOrderByDayNumberAscTimeSlotAsc(TravelPlan plan);

    @Modifying
    @Query("DELETE FROM ScheduleItem s WHERE s.travelPlan = :plan")
    void deleteAllByTravelPlan(TravelPlan plan);
}
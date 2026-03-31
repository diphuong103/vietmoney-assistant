package com.vietmoney.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tourist_spots")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TouristSpot {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String city;
    private String province;
    private String address;
    private String description;
    private String imageUrl;
    private Double latitude;
    private Double longitude;
    private Double rating;
    private String ticketPrice;
    private String openHours;
    private String category;
}

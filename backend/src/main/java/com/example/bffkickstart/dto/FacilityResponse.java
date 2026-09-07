package com.example.bffkickstart.dto;

import com.example.bffkickstart.domain.Facility;
import com.example.bffkickstart.domain.FacilityType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class FacilityResponse {
    private Long id;
    private String name;
    private FacilityType facilityType;
    private String addressLine1;
    private String city;
    private String state;
    private String zip;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;

    public static FacilityResponse from(Facility f) {
        return FacilityResponse.builder()
                .id(f.getId())
                .name(f.getName())
                .facilityType(f.getFacilityType())
                .addressLine1(f.getAddressLine1())
                .city(f.getCity())
                .state(f.getState())
                .zip(f.getZip())
                .active(f.isActive())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .build();
    }
}

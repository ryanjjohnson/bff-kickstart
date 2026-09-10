package com.example.bffkickstart.dtos;

import com.example.bffkickstart.models.Facility;
import com.example.bffkickstart.models.FacilityType;
import com.example.bffkickstart.models.LocationSource;

import java.math.BigDecimal;
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
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Double locationAccuracyM;
    private Double locationAltitudeM;
    private Double locationAltitudeAccuracyM;
    private Double locationHeadingDeg;
    private Double locationSpeedMps;
    private Instant locationCapturedAt;
    private LocationSource locationSource;
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
                .latitude(f.getLatitude())
                .longitude(f.getLongitude())
                .locationAccuracyM(f.getLocationAccuracyM())
                .locationAltitudeM(f.getLocationAltitudeM())
                .locationAltitudeAccuracyM(f.getLocationAltitudeAccuracyM())
                .locationHeadingDeg(f.getLocationHeadingDeg())
                .locationSpeedMps(f.getLocationSpeedMps())
                .locationCapturedAt(f.getLocationCapturedAt())
                .locationSource(f.getLocationSource())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .build();
    }
}

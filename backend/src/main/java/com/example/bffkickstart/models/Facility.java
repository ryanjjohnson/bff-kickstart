package com.example.bffkickstart.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "facility")
@Getter
@Setter
@NoArgsConstructor
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "facility_type", nullable = false, length = 30)
    private FacilityType facilityType;

    @Column(name = "address_line1", nullable = false, length = 200)
    private String addressLine1;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 2)
    private String state;

    @Column(nullable = false, length = 10)
    private String zip;

    @Column(nullable = false)
    private boolean active = true;

    @Column(precision = 9, scale = 6)
    private java.math.BigDecimal latitude;

    @Column(precision = 9, scale = 6)
    private java.math.BigDecimal longitude;

    @Column(name = "location_accuracy_m")
    private Double locationAccuracyM;

    @Column(name = "location_altitude_m")
    private Double locationAltitudeM;

    @Column(name = "location_altitude_accuracy_m")
    private Double locationAltitudeAccuracyM;

    @Column(name = "location_heading_deg")
    private Double locationHeadingDeg;

    @Column(name = "location_speed_mps")
    private Double locationSpeedMps;

    @Column(name = "location_captured_at")
    private Instant locationCapturedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_source", length = 10)
    private LocationSource locationSource;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}

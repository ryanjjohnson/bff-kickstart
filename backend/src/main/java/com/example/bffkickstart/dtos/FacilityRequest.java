package com.example.bffkickstart.dtos;

import com.example.bffkickstart.models.FacilityType;
import com.example.bffkickstart.models.LocationSource;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.Instant;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FacilityRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 200, message = "Name must be at most 200 characters")
    private String name;

    @NotNull(message = "Facility type is required")
    private FacilityType facilityType;

    @NotBlank(message = "Address is required")
    @Size(max = 200, message = "Address must be at most 200 characters")
    private String addressLine1;

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City must be at most 100 characters")
    private String city;

    @NotBlank(message = "State is required")
    @Pattern(regexp = "^[A-Z]{2}$", message = "State must be a 2-letter uppercase code (e.g. OH)")
    private String state;

    @NotBlank(message = "ZIP code is required")
    @Pattern(regexp = "^\\d{5}(-\\d{4})?$", message = "ZIP must be in the form 12345 or 12345-6789")
    private String zip;

    private boolean active = true;

    // --- Optional location. latitude/longitude are the editable pair; the rest is
    // metadata captured by the device's Geolocation API when the fix was taken
    // (cleared when coordinates are entered by hand - see FacilityService#apply). ---

    @DecimalMin(value = "-90", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90", message = "Latitude must be between -90 and 90")
    private BigDecimal latitude;

    @DecimalMin(value = "-180", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180", message = "Longitude must be between -180 and 180")
    private BigDecimal longitude;

    @PositiveOrZero(message = "Accuracy must be zero or greater")
    private Double locationAccuracyM;

    private Double locationAltitudeM;

    @PositiveOrZero(message = "Altitude accuracy must be zero or greater")
    private Double locationAltitudeAccuracyM;

    @DecimalMin(value = "0", message = "Heading must be between 0 and 360")
    @DecimalMax(value = "360", message = "Heading must be between 0 and 360")
    private Double locationHeadingDeg;

    @PositiveOrZero(message = "Speed must be zero or greater")
    private Double locationSpeedMps;

    private Instant locationCapturedAt;

    private LocationSource locationSource;

    @AssertTrue(message = "Latitude and longitude must be provided together")
    public boolean isCoordinatesPaired() {
        return (latitude == null) == (longitude == null);
    }
}

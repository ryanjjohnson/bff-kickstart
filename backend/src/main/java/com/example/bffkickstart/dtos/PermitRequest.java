package com.example.bffkickstart.dtos;

import com.example.bffkickstart.models.PermitStatus;
import com.example.bffkickstart.models.PermitType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class PermitRequest {

    @NotNull(message = "Facility is required")
    private Long facilityId;

    @NotBlank(message = "Permit number is required")
    @Size(max = 50, message = "Permit number must be at most 50 characters")
    private String permitNumber;

    @NotNull(message = "Permit type is required")
    private PermitType permitType;

    @NotNull(message = "Status is required")
    private PermitStatus status;

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;

    private LocalDate issuedDate;

    private LocalDate expirationDate;

    @AssertTrue(message = "Expiration date must be on or after the issued date")
    public boolean isExpirationAfterIssued() {
        if (issuedDate == null || expirationDate == null) {
            return true;
        }
        return !expirationDate.isBefore(issuedDate);
    }
}

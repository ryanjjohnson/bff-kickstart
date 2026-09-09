package com.example.bffkickstart.dtos;

import com.example.bffkickstart.models.InspectionOutcome;
import com.example.bffkickstart.models.PermitStatus;
import com.example.bffkickstart.models.PermitType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class ComplianceReportRow {
    private String facilityName;
    private String city;
    private String permitNumber;
    private PermitType permitType;
    private PermitStatus status;
    private LocalDate expirationDate;
    private Long daysUntilExpiration;
    private InspectionOutcome lastInspectionOutcome;
    private LocalDate lastInspectionDate;
}

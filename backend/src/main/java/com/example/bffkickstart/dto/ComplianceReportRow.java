package com.example.bffkickstart.dto;

import com.example.bffkickstart.domain.InspectionOutcome;
import com.example.bffkickstart.domain.PermitStatus;
import com.example.bffkickstart.domain.PermitType;
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

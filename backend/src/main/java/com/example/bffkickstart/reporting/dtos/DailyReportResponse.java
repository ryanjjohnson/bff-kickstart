package com.example.bffkickstart.reporting.dtos;

import com.example.bffkickstart.reporting.models.DailyReport;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class DailyReportResponse {
    private Long id;
    private LocalDate reportDate;
    private int facilitiesActiveCount;
    private int newPermitsIssuedCount;
    private int permitsExpiringSoonCount;
    private int inspectionsCompletedCount;
    private int inspectionsPassedCount;
    private int inspectionsFailedCount;
    private BigDecimal complianceRatePct;

    public static DailyReportResponse from(DailyReport r) {
        return DailyReportResponse.builder()
                .id(r.getId())
                .reportDate(r.getReportDate())
                .facilitiesActiveCount(r.getFacilitiesActiveCount())
                .newPermitsIssuedCount(r.getNewPermitsIssuedCount())
                .permitsExpiringSoonCount(r.getPermitsExpiringSoonCount())
                .inspectionsCompletedCount(r.getInspectionsCompletedCount())
                .inspectionsPassedCount(r.getInspectionsPassedCount())
                .inspectionsFailedCount(r.getInspectionsFailedCount())
                .complianceRatePct(r.getComplianceRatePct())
                .build();
    }
}

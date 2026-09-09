package com.example.bffkickstart.dtos;

import com.example.bffkickstart.models.Inspection;
import com.example.bffkickstart.models.InspectionOutcome;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Builder
public class InspectionResponse {
    private Long id;
    private Long facilityId;
    private String facilityName;
    private Long permitId;
    private String permitNumber;
    private String inspectorName;
    private LocalDate scheduledDate;
    private LocalDate completedDate;
    private InspectionOutcome outcome;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public static InspectionResponse from(Inspection i) {
        return InspectionResponse.builder()
                .id(i.getId())
                .facilityId(i.getFacility().getId())
                .facilityName(i.getFacility().getName())
                .permitId(i.getPermit() != null ? i.getPermit().getId() : null)
                .permitNumber(i.getPermit() != null ? i.getPermit().getPermitNumber() : null)
                .inspectorName(i.getInspectorName())
                .scheduledDate(i.getScheduledDate())
                .completedDate(i.getCompletedDate())
                .outcome(i.getOutcome())
                .notes(i.getNotes())
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .build();
    }
}

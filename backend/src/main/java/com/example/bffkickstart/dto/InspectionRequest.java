package com.example.bffkickstart.dto;

import com.example.bffkickstart.domain.InspectionOutcome;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class InspectionRequest {

    @NotNull(message = "Facility is required")
    private Long facilityId;

    private Long permitId;

    @NotBlank(message = "Inspector name is required")
    @Size(max = 150, message = "Inspector name must be at most 150 characters")
    private String inspectorName;

    @NotNull(message = "Scheduled date is required")
    private LocalDate scheduledDate;

    private LocalDate completedDate;

    @NotNull(message = "Outcome is required")
    private InspectionOutcome outcome;

    @Size(max = 2000, message = "Notes must be at most 2000 characters")
    private String notes;

    @AssertTrue(message = "Completed date cannot be before the scheduled date")
    public boolean isCompletedAfterScheduled() {
        if (scheduledDate == null || completedDate == null) {
            return true;
        }
        return !completedDate.isBefore(scheduledDate);
    }
}

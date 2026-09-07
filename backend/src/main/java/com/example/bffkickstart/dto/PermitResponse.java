package com.example.bffkickstart.dto;

import com.example.bffkickstart.domain.Permit;
import com.example.bffkickstart.domain.PermitStatus;
import com.example.bffkickstart.domain.PermitType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Builder
public class PermitResponse {
    private Long id;
    private Long facilityId;
    private String facilityName;
    private String permitNumber;
    private PermitType permitType;
    private PermitStatus status;
    private String description;
    private LocalDate issuedDate;
    private LocalDate expirationDate;
    private Instant createdAt;
    private Instant updatedAt;

    public static PermitResponse from(Permit p) {
        return PermitResponse.builder()
                .id(p.getId())
                .facilityId(p.getFacility().getId())
                .facilityName(p.getFacility().getName())
                .permitNumber(p.getPermitNumber())
                .permitType(p.getPermitType())
                .status(p.getStatus())
                .description(p.getDescription())
                .issuedDate(p.getIssuedDate())
                .expirationDate(p.getExpirationDate())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}

package com.example.bffkickstart.dtos;

import com.example.bffkickstart.repositories.InspectionAttachmentRepository.InspectionAttachmentSummary;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class InspectionAttachmentResponse {
    private Long id;
    private String filename;
    private String contentType;
    private long sizeBytes;
    private String uploadedBy;
    private Instant uploadedAt;

    public static InspectionAttachmentResponse from(InspectionAttachmentSummary a) {
        return InspectionAttachmentResponse.builder()
                .id(a.getId())
                .filename(a.getFilename())
                .contentType(a.getContentType())
                .sizeBytes(a.getSizeBytes())
                .uploadedBy(a.getUploadedBy())
                .uploadedAt(a.getUploadedAt())
                .build();
    }
}

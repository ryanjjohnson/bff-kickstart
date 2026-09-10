package com.example.bffkickstart.services;

import com.example.bffkickstart.dtos.InspectionAttachmentResponse;
import com.example.bffkickstart.exceptions.NotFoundException;
import com.example.bffkickstart.models.Inspection;
import com.example.bffkickstart.models.InspectionAttachment;
import com.example.bffkickstart.repositories.InspectionAttachmentRepository;
import com.example.bffkickstart.repositories.InspectionRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@Transactional
public class InspectionAttachmentService {

    private final InspectionAttachmentRepository attachmentRepository;
    private final InspectionRepository inspectionRepository;

    public InspectionAttachmentService(InspectionAttachmentRepository attachmentRepository,
                                        InspectionRepository inspectionRepository) {
        this.attachmentRepository = attachmentRepository;
        this.inspectionRepository = inspectionRepository;
    }

    @Transactional(readOnly = true)
    public List<InspectionAttachmentResponse> list(Long inspectionId) {
        requireInspection(inspectionId);
        return attachmentRepository.findByInspectionIdOrderByUploadedAtDesc(inspectionId).stream()
                .map(InspectionAttachmentResponse::from)
                .toList();
    }

    public InspectionAttachmentResponse upload(Long inspectionId, MultipartFile file, Authentication authentication)
            throws IOException {
        Inspection inspection = requireInspection(inspectionId);
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Attachment file is empty");
        }
        InspectionAttachment attachment = new InspectionAttachment();
        attachment.setInspection(inspection);
        attachment.setFilename(sanitizeFilename(file.getOriginalFilename()));
        attachment.setContentType(file.getContentType() != null && !file.getContentType().isBlank()
                ? file.getContentType()
                : "application/octet-stream");
        attachment.setSizeBytes(file.getSize());
        attachment.setData(file.getBytes());
        attachment.setUploadedBy(resolveUsername(authentication));
        InspectionAttachment saved = attachmentRepository.save(attachment);
        return InspectionAttachmentResponse.builder()
                .id(saved.getId())
                .filename(saved.getFilename())
                .contentType(saved.getContentType())
                .sizeBytes(saved.getSizeBytes())
                .uploadedBy(saved.getUploadedBy())
                .uploadedAt(saved.getUploadedAt())
                .build();
    }

    /** Full row including bytes - only for the download endpoint. */
    @Transactional(readOnly = true)
    public InspectionAttachment getForDownload(Long inspectionId, Long attachmentId) {
        return attachmentRepository.findByIdAndInspectionId(attachmentId, inspectionId)
                .orElseThrow(() -> new NotFoundException("Attachment %d not found".formatted(attachmentId)));
    }

    public void delete(Long inspectionId, Long attachmentId) {
        InspectionAttachment attachment = attachmentRepository.findByIdAndInspectionId(attachmentId, inspectionId)
                .orElseThrow(() -> new NotFoundException("Attachment %d not found".formatted(attachmentId)));
        attachmentRepository.delete(attachment);
    }

    private Inspection requireInspection(Long inspectionId) {
        return inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new NotFoundException("Inspection %d not found".formatted(inspectionId)));
    }

    /**
     * Browsers send a bare name, but nothing stops a raw API client sending a
     * path - keep only the final segment and never store an empty name.
     */
    private static String sanitizeFilename(String original) {
        String name = original == null ? "" : original;
        int lastSeparator = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (lastSeparator >= 0) {
            name = name.substring(lastSeparator + 1);
        }
        if (name.isBlank()) {
            name = "attachment";
        }
        return name.length() > 255 ? name.substring(name.length() - 255) : name;
    }

    /**
     * Human-readable uploader for the audit column: preferred_username for both
     * the session (OidcUser) and Bearer-JWT paths, falling back to the
     * Authentication's own name (the subject UUID) if the claim is absent.
     */
    private static String resolveUsername(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        if (authentication.getPrincipal() instanceof OidcUser user && user.getPreferredUsername() != null) {
            return user.getPreferredUsername();
        }
        if (authentication.getPrincipal() instanceof Jwt jwt && jwt.getClaimAsString("preferred_username") != null) {
            return jwt.getClaimAsString("preferred_username");
        }
        return authentication.getName();
    }
}

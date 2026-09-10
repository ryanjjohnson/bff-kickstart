package com.example.bffkickstart.controllers;

import com.example.bffkickstart.dtos.InspectionAttachmentResponse;
import com.example.bffkickstart.models.InspectionAttachment;
import com.example.bffkickstart.services.InspectionAttachmentService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/inspections/{inspectionId}/attachments")
@PreAuthorize("hasAnyRole('Admin','Inspector','Viewer')")
public class InspectionAttachmentController {

    private final InspectionAttachmentService attachmentService;

    public InspectionAttachmentController(InspectionAttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @GetMapping
    public List<InspectionAttachmentResponse> list(@PathVariable Long inspectionId) {
        return attachmentService.list(inspectionId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Inspector')")
    public ResponseEntity<InspectionAttachmentResponse> upload(@PathVariable Long inspectionId,
                                                                 @RequestParam("file") MultipartFile file,
                                                                 Authentication authentication) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(attachmentService.upload(inspectionId, file, authentication));
    }

    @GetMapping("/{attachmentId}")
    public ResponseEntity<byte[]> download(@PathVariable Long inspectionId, @PathVariable Long attachmentId) {
        InspectionAttachment attachment = attachmentService.getForDownload(inspectionId, attachmentId);
        // ContentDisposition handles the RFC 6266/5987 escaping of arbitrary
        // user-supplied filenames (quotes, non-ASCII) - never format it by hand.
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(attachment.getFilename(), java.nio.charset.StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                // Attachment bytes are user-supplied: force download semantics and keep
                // browsers from content-sniffing an uploaded file into executing markup.
                .header("X-Content-Type-Options", "nosniff")
                .body(attachment.getData());
    }

    @DeleteMapping("/{attachmentId}")
    @PreAuthorize("hasAnyRole('Admin','Inspector')")
    public ResponseEntity<Void> delete(@PathVariable Long inspectionId, @PathVariable Long attachmentId) {
        attachmentService.delete(inspectionId, attachmentId);
        return ResponseEntity.noContent().build();
    }
}

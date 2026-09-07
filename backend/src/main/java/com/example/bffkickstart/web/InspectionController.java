package com.example.bffkickstart.web;

import com.example.bffkickstart.domain.InspectionOutcome;
import com.example.bffkickstart.dto.BulkImportResult;
import com.example.bffkickstart.dto.InspectionRequest;
import com.example.bffkickstart.dto.InspectionResponse;
import com.example.bffkickstart.dto.PageResponse;
import com.example.bffkickstart.service.InspectionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@RestController
@RequestMapping("/api/v1/inspections")
@PreAuthorize("hasAnyRole('Admin','Inspector','Viewer')")
public class InspectionController {

    private final InspectionService inspectionService;

    public InspectionController(InspectionService inspectionService) {
        this.inspectionService = inspectionService;
    }

    @GetMapping
    public PageResponse<InspectionResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long facilityId,
            @RequestParam(required = false) InspectionOutcome outcome,
            Pageable pageable) {
        return inspectionService.search(q, facilityId, outcome, pageable);
    }

    @GetMapping("/{id}")
    public InspectionResponse getById(@PathVariable Long id) {
        return inspectionService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Inspector')")
    public ResponseEntity<InspectionResponse> create(@Valid @RequestBody InspectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inspectionService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Inspector')")
    public InspectionResponse update(@PathVariable Long id, @Valid @RequestBody InspectionRequest request) {
        return inspectionService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Inspector')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        inspectionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('Data Manager')")
    public ResponseEntity<byte[]> export() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        inspectionService.writeCsv(out);
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"inspections.csv\"")
                .body(out.toByteArray());
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('Data Manager')")
    public BulkImportResult importCsv(@RequestParam("file") MultipartFile file) throws IOException {
        return inspectionService.importCsv(file);
    }
}

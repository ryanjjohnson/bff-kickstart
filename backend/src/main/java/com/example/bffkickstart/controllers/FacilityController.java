package com.example.bffkickstart.controllers;

import com.example.bffkickstart.models.FacilityType;
import com.example.bffkickstart.dtos.BulkImportResult;
import com.example.bffkickstart.dtos.FacilityRequest;
import com.example.bffkickstart.dtos.FacilityResponse;
import com.example.bffkickstart.dtos.PageResponse;
import com.example.bffkickstart.services.FacilityService;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
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
@RequestMapping("/api/v1/facilities")
@PreAuthorize("hasAnyRole('Admin','Inspector','Viewer')")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @GetMapping
    public PageResponse<FacilityResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) FacilityType type,
            @RequestParam(required = false) Boolean active,
            @ParameterObject Pageable pageable) {
        return facilityService.search(q, type, active, pageable);
    }

    @GetMapping("/{id}")
    public FacilityResponse getById(@PathVariable Long id) {
        return facilityService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<FacilityResponse> create(@Valid @RequestBody FacilityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facilityService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public FacilityResponse update(@PathVariable Long id, @Valid @RequestBody FacilityRequest request) {
        return facilityService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        facilityService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('Data Manager')")
    public ResponseEntity<byte[]> export() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        facilityService.writeCsv(out);
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"facilities.csv\"")
                .body(out.toByteArray());
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('Data Manager')")
    public BulkImportResult importCsv(@RequestParam("file") MultipartFile file) throws IOException {
        return facilityService.importCsv(file);
    }
}

package com.example.bffkickstart.controllers;

import com.example.bffkickstart.models.PermitStatus;
import com.example.bffkickstart.models.PermitType;
import com.example.bffkickstart.dtos.BulkImportResult;
import com.example.bffkickstart.dtos.PageResponse;
import com.example.bffkickstart.dtos.PermitRequest;
import com.example.bffkickstart.dtos.PermitResponse;
import com.example.bffkickstart.services.PermitService;
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
@RequestMapping("/api/v1/permits")
@PreAuthorize("hasAnyRole('Admin','Inspector','Viewer')")
public class PermitController {

    private final PermitService permitService;

    public PermitController(PermitService permitService) {
        this.permitService = permitService;
    }

    @GetMapping
    public PageResponse<PermitResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long facilityId,
            @RequestParam(required = false) PermitType type,
            @RequestParam(required = false) PermitStatus status,
            Pageable pageable) {
        return permitService.search(q, facilityId, type, status, pageable);
    }

    @GetMapping("/{id}")
    public PermitResponse getById(@PathVariable Long id) {
        return permitService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<PermitResponse> create(@Valid @RequestBody PermitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(permitService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public PermitResponse update(@PathVariable Long id, @Valid @RequestBody PermitRequest request) {
        return permitService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        permitService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('Data Manager')")
    public ResponseEntity<byte[]> export() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        permitService.writeCsv(out);
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"permits.csv\"")
                .body(out.toByteArray());
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('Data Manager')")
    public BulkImportResult importCsv(@RequestParam("file") MultipartFile file) throws IOException {
        return permitService.importCsv(file);
    }
}

package com.example.bffkickstart.web;

import com.example.bffkickstart.dto.ComplianceReportRow;
import com.example.bffkickstart.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports/compliance")
@PreAuthorize("hasAnyRole('Admin','Inspector','Viewer')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public List<ComplianceReportRow> preview() {
        return reportService.buildComplianceReport();
    }

    @GetMapping(value = "/csv")
    public ResponseEntity<byte[]> csv() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        reportService.writeComplianceReportCsv(out);
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"compliance-report.csv\"")
                .body(out.toByteArray());
    }

    @GetMapping(value = "/pdf")
    public ResponseEntity<byte[]> pdf() {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        reportService.writeComplianceReportPdf(out);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"compliance-report.pdf\"")
                .body(out.toByteArray());
    }
}

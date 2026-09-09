package com.example.bffkickstart.services;

import com.example.bffkickstart.models.Inspection;
import com.example.bffkickstart.models.Permit;
import com.example.bffkickstart.dtos.ComplianceReportRow;
import com.example.bffkickstart.repositories.InspectionRepository;
import com.example.bffkickstart.repositories.PermitRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final PermitRepository permitRepository;
    private final InspectionRepository inspectionRepository;

    public ReportService(PermitRepository permitRepository, InspectionRepository inspectionRepository) {
        this.permitRepository = permitRepository;
        this.inspectionRepository = inspectionRepository;
    }

    public List<ComplianceReportRow> buildComplianceReport() {
        List<Permit> permits = permitRepository.findAll();
        List<Long> facilityIds = permits.stream().map(p -> p.getFacility().getId()).distinct().toList();

        Map<Long, Inspection> lastInspectionByFacility = inspectionRepository
                .findAllByFacility_IdInOrderByScheduledDateDesc(facilityIds)
                .stream()
                .collect(Collectors.toMap(
                        i -> i.getFacility().getId(),
                        i -> i,
                        (first, second) -> first,
                        java.util.LinkedHashMap::new));

        LocalDate today = LocalDate.now();

        return permits.stream()
                .map(p -> {
                    Inspection lastInspection = lastInspectionByFacility.get(p.getFacility().getId());
                    Long daysUntilExpiration = p.getExpirationDate() == null
                            ? null
                            : ChronoUnit.DAYS.between(today, p.getExpirationDate());
                    return ComplianceReportRow.builder()
                            .facilityName(p.getFacility().getName())
                            .city(p.getFacility().getCity())
                            .permitNumber(p.getPermitNumber())
                            .permitType(p.getPermitType())
                            .status(p.getStatus())
                            .expirationDate(p.getExpirationDate())
                            .daysUntilExpiration(daysUntilExpiration)
                            .lastInspectionOutcome(lastInspection != null ? lastInspection.getOutcome() : null)
                            .lastInspectionDate(lastInspection != null ? lastInspection.getScheduledDate() : null)
                            .build();
                })
                .sorted(Comparator.comparing(
                        ComplianceReportRow::getDaysUntilExpiration,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    public void writeComplianceReportCsv(OutputStream out) throws IOException {
        List<ComplianceReportRow> rows = buildComplianceReport();
        try (CSVPrinter printer = new CSVPrinter(
                new OutputStreamWriter(out, StandardCharsets.UTF_8),
                CSVFormat.DEFAULT.builder()
                        .setHeader("Facility", "City", "Permit Number", "Permit Type", "Status",
                                "Expiration Date", "Days Until Expiration", "Last Inspection Outcome", "Last Inspection Date")
                        .get())) {
            for (ComplianceReportRow row : rows) {
                printer.printRecord(
                        row.getFacilityName(),
                        row.getCity(),
                        row.getPermitNumber(),
                        row.getPermitType(),
                        row.getStatus(),
                        row.getExpirationDate(),
                        row.getDaysUntilExpiration(),
                        row.getLastInspectionOutcome(),
                        row.getLastInspectionDate());
            }
        }
    }

    public void writeComplianceReportPdf(OutputStream out) {
        List<ComplianceReportRow> rows = buildComplianceReport();
        Document document = new Document(PageSize.A4.rotate(), 24, 24, 24, 24);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD);
            Font subtitleFont = new Font(Font.HELVETICA, 9, Font.ITALIC);
            Font headerFont = new Font(Font.HELVETICA, 9, Font.BOLD);
            Font cellFont = new Font(Font.HELVETICA, 9, Font.NORMAL);

            Paragraph title = new Paragraph("Permit Compliance Report", titleFont);
            title.setAlignment(Element.ALIGN_LEFT);
            document.add(title);
            document.add(new Paragraph("Generated " + Instant.now(), subtitleFont));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(9);
            table.setWidthPercentage(100);
            String[] headers = {"Facility", "City", "Permit #", "Type", "Status",
                    "Expiration", "Days Left", "Last Outcome", "Last Inspection"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Paragraph(h, headerFont));
                cell.setBackgroundColor(new java.awt.Color(0x0B, 0x3D, 0x2E));
                cell.setPadding(5);
                table.addCell(cell);
            }

            for (ComplianceReportRow row : rows) {
                addCell(table, row.getFacilityName(), cellFont);
                addCell(table, row.getCity(), cellFont);
                addCell(table, row.getPermitNumber(), cellFont);
                addCell(table, String.valueOf(row.getPermitType()), cellFont);
                addCell(table, String.valueOf(row.getStatus()), cellFont);
                addCell(table, row.getExpirationDate() == null ? "-" : row.getExpirationDate().toString(), cellFont);
                addCell(table, row.getDaysUntilExpiration() == null ? "-" : String.valueOf(row.getDaysUntilExpiration()), cellFont);
                addCell(table, row.getLastInspectionOutcome() == null ? "-" : String.valueOf(row.getLastInspectionOutcome()), cellFont);
                addCell(table, row.getLastInspectionDate() == null ? "-" : row.getLastInspectionDate().toString(), cellFont);
            }

            document.add(table);
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }
    }

    private void addCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Paragraph(text == null ? "-" : text, font));
        cell.setPadding(4);
        table.addCell(cell);
    }
}

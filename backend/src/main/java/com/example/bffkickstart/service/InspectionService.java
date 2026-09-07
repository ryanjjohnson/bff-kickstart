package com.example.bffkickstart.service;

import com.example.bffkickstart.csv.CsvImportSupport;
import com.example.bffkickstart.domain.Inspection;
import com.example.bffkickstart.domain.InspectionOutcome;
import com.example.bffkickstart.domain.Permit;
import com.example.bffkickstart.dto.BulkImportResult;
import com.example.bffkickstart.dto.InspectionRequest;
import com.example.bffkickstart.dto.InspectionResponse;
import com.example.bffkickstart.dto.PageResponse;
import com.example.bffkickstart.exception.NotFoundException;
import com.example.bffkickstart.repository.InspectionRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Validator;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class InspectionService {

    private static final List<String> CSV_HEADERS = List.of("id", "facilityId", "permitId", "inspectorName",
            "scheduledDate", "completedDate", "outcome", "notes");

    private final InspectionRepository inspectionRepository;
    private final FacilityService facilityService;
    private final PermitService permitService;
    private final Validator validator;

    public InspectionService(InspectionRepository inspectionRepository,
                              FacilityService facilityService,
                              PermitService permitService,
                              Validator validator) {
        this.inspectionRepository = inspectionRepository;
        this.facilityService = facilityService;
        this.permitService = permitService;
        this.validator = validator;
    }

    @Transactional(readOnly = true)
    public PageResponse<InspectionResponse> search(String q, Long facilityId, InspectionOutcome outcome, Pageable pageable) {
        Specification<Inspection> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String like = "%" + q.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("inspectorName")), like),
                        cb.like(cb.lower(root.get("notes")), like)
                ));
            }
            if (facilityId != null) {
                predicates.add(cb.equal(root.get("facility").get("id"), facilityId));
            }
            if (outcome != null) {
                predicates.add(cb.equal(root.get("outcome"), outcome));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<Inspection> page = inspectionRepository.findAll(spec, pageable);
        return PageResponse.of(page, InspectionResponse::from);
    }

    @Transactional(readOnly = true)
    public InspectionResponse getById(Long id) {
        return InspectionResponse.from(getEntity(id));
    }

    Inspection getEntity(Long id) {
        return inspectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Inspection %d not found".formatted(id)));
    }

    public InspectionResponse create(InspectionRequest request) {
        Inspection inspection = new Inspection();
        inspection.setFacility(facilityService.getEntity(request.getFacilityId()));
        apply(inspection, request);
        return InspectionResponse.from(inspectionRepository.save(inspection));
    }

    public InspectionResponse update(Long id, InspectionRequest request) {
        Inspection inspection = getEntity(id);
        if (!inspection.getFacility().getId().equals(request.getFacilityId())) {
            inspection.setFacility(facilityService.getEntity(request.getFacilityId()));
        }
        apply(inspection, request);
        return InspectionResponse.from(inspectionRepository.save(inspection));
    }

    public void delete(Long id) {
        Inspection inspection = getEntity(id);
        inspectionRepository.delete(inspection);
    }

    private void apply(Inspection inspection, InspectionRequest request) {
        if (request.getPermitId() != null) {
            Permit permit = permitService.getEntity(request.getPermitId());
            if (!permit.getFacility().getId().equals(request.getFacilityId())) {
                throw new IllegalArgumentException("Selected permit does not belong to the selected facility");
            }
            inspection.setPermit(permit);
        } else {
            inspection.setPermit(null);
        }
        inspection.setInspectorName(request.getInspectorName());
        inspection.setScheduledDate(request.getScheduledDate());
        inspection.setCompletedDate(request.getCompletedDate());
        inspection.setOutcome(request.getOutcome());
        inspection.setNotes(request.getNotes());
    }

    @Transactional(readOnly = true)
    public void writeCsv(OutputStream out) throws IOException {
        try (CSVPrinter printer = new CSVPrinter(
                new OutputStreamWriter(out, StandardCharsets.UTF_8),
                CSVFormat.DEFAULT.builder().setHeader(CSV_HEADERS.toArray(new String[0])).get())) {
            for (Inspection i : inspectionRepository.findAll()) {
                printer.printRecord(i.getId(), i.getFacility().getId(),
                        i.getPermit() == null ? null : i.getPermit().getId(), i.getInspectorName(),
                        i.getScheduledDate(), i.getCompletedDate(), i.getOutcome(), i.getNotes());
            }
        }
    }

    /** No natural key exists besides id, so a row without one always creates a new inspection. */
    public BulkImportResult importCsv(MultipartFile file) throws IOException {
        List<CSVRecord> records = CsvImportSupport.parse(file.getInputStream());
        int created = 0;
        int updated = 0;
        int skipped = 0;
        List<BulkImportResult.RowError> errors = new ArrayList<>();

        for (CSVRecord record : records) {
            int rowNum = (int) record.getRecordNumber() + 1;
            try {
                InspectionRequest request = new InspectionRequest();
                String facilityIdStr = CsvImportSupport.get(record, "facilityId");
                request.setFacilityId(facilityIdStr == null ? null : Long.valueOf(facilityIdStr));
                String permitIdStr = CsvImportSupport.get(record, "permitId");
                request.setPermitId(permitIdStr == null ? null : Long.valueOf(permitIdStr));
                request.setInspectorName(CsvImportSupport.get(record, "inspectorName"));
                String scheduled = CsvImportSupport.get(record, "scheduledDate");
                request.setScheduledDate(scheduled == null ? null : LocalDate.parse(scheduled));
                String completed = CsvImportSupport.get(record, "completedDate");
                request.setCompletedDate(completed == null ? null : LocalDate.parse(completed));
                String outcome = CsvImportSupport.get(record, "outcome");
                request.setOutcome(outcome == null ? null : InspectionOutcome.valueOf(outcome.toUpperCase()));
                request.setNotes(CsvImportSupport.get(record, "notes"));

                String validationError = CsvImportSupport.validate(validator, request);
                if (validationError != null) {
                    errors.add(BulkImportResult.RowError.builder().row(rowNum).message(validationError).build());
                    skipped++;
                    continue;
                }

                String idColumn = CsvImportSupport.get(record, "id");
                Inspection existing = idColumn == null ? null
                        : inspectionRepository.findById(Long.parseLong(idColumn)).orElse(null);
                if (existing != null) {
                    existing.setFacility(facilityService.getEntity(request.getFacilityId()));
                    apply(existing, request);
                    inspectionRepository.save(existing);
                    updated++;
                } else {
                    Inspection inspection = new Inspection();
                    inspection.setFacility(facilityService.getEntity(request.getFacilityId()));
                    apply(inspection, request);
                    inspectionRepository.save(inspection);
                    created++;
                }
            } catch (Exception e) {
                errors.add(BulkImportResult.RowError.builder().row(rowNum).message(e.getMessage()).build());
                skipped++;
            }
        }
        return BulkImportResult.builder().created(created).updated(updated).skipped(skipped).errors(errors).build();
    }
}

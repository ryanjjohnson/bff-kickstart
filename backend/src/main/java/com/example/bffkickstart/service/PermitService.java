package com.example.bffkickstart.service;

import com.example.bffkickstart.csv.CsvImportSupport;
import com.example.bffkickstart.domain.Facility;
import com.example.bffkickstart.domain.Permit;
import com.example.bffkickstart.domain.PermitStatus;
import com.example.bffkickstart.domain.PermitType;
import com.example.bffkickstart.dto.BulkImportResult;
import com.example.bffkickstart.dto.PageResponse;
import com.example.bffkickstart.dto.PermitRequest;
import com.example.bffkickstart.dto.PermitResponse;
import com.example.bffkickstart.exception.ConflictException;
import com.example.bffkickstart.exception.NotFoundException;
import com.example.bffkickstart.repository.PermitRepository;
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
public class PermitService {

    private static final List<String> CSV_HEADERS = List.of("id", "facilityId", "permitNumber", "permitType",
            "status", "description", "issuedDate", "expirationDate");

    private final PermitRepository permitRepository;
    private final FacilityService facilityService;
    private final Validator validator;

    public PermitService(PermitRepository permitRepository, FacilityService facilityService, Validator validator) {
        this.permitRepository = permitRepository;
        this.facilityService = facilityService;
        this.validator = validator;
    }

    @Transactional(readOnly = true)
    public PageResponse<PermitResponse> search(String q, Long facilityId, PermitType type, PermitStatus status, Pageable pageable) {
        Specification<Permit> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String like = "%" + q.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("permitNumber")), like),
                        cb.like(cb.lower(root.get("description")), like)
                ));
            }
            if (facilityId != null) {
                predicates.add(cb.equal(root.get("facility").get("id"), facilityId));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("permitType"), type));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<Permit> page = permitRepository.findAll(spec, pageable);
        return PageResponse.of(page, PermitResponse::from);
    }

    @Transactional(readOnly = true)
    public PermitResponse getById(Long id) {
        return PermitResponse.from(getEntity(id));
    }

    Permit getEntity(Long id) {
        return permitRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Permit %d not found".formatted(id)));
    }

    public PermitResponse create(PermitRequest request) {
        if (permitRepository.existsByPermitNumberIgnoreCase(request.getPermitNumber())) {
            throw new ConflictException("Permit number '%s' already exists".formatted(request.getPermitNumber()));
        }
        Permit permit = new Permit();
        Facility facility = facilityService.getEntity(request.getFacilityId());
        permit.setFacility(facility);
        apply(permit, request);
        return PermitResponse.from(permitRepository.save(permit));
    }

    public PermitResponse update(Long id, PermitRequest request) {
        Permit permit = getEntity(id);
        if (!permit.getPermitNumber().equalsIgnoreCase(request.getPermitNumber())
                && permitRepository.existsByPermitNumberIgnoreCase(request.getPermitNumber())) {
            throw new ConflictException("Permit number '%s' already exists".formatted(request.getPermitNumber()));
        }
        if (!permit.getFacility().getId().equals(request.getFacilityId())) {
            permit.setFacility(facilityService.getEntity(request.getFacilityId()));
        }
        apply(permit, request);
        return PermitResponse.from(permitRepository.save(permit));
    }

    public void delete(Long id) {
        Permit permit = getEntity(id);
        permitRepository.delete(permit);
    }

    private void apply(Permit permit, PermitRequest request) {
        permit.setPermitNumber(request.getPermitNumber());
        permit.setPermitType(request.getPermitType());
        permit.setStatus(request.getStatus());
        permit.setDescription(request.getDescription());
        permit.setIssuedDate(request.getIssuedDate());
        permit.setExpirationDate(request.getExpirationDate());
    }

    @Transactional(readOnly = true)
    public void writeCsv(OutputStream out) throws IOException {
        try (CSVPrinter printer = new CSVPrinter(
                new OutputStreamWriter(out, StandardCharsets.UTF_8),
                CSVFormat.DEFAULT.builder().setHeader(CSV_HEADERS.toArray(new String[0])).get())) {
            for (Permit p : permitRepository.findAll()) {
                printer.printRecord(p.getId(), p.getFacility().getId(), p.getPermitNumber(), p.getPermitType(),
                        p.getStatus(), p.getDescription(), p.getIssuedDate(), p.getExpirationDate());
            }
        }
    }

    public BulkImportResult importCsv(MultipartFile file) throws IOException {
        List<CSVRecord> records = CsvImportSupport.parse(file.getInputStream());
        int created = 0;
        int updated = 0;
        int skipped = 0;
        List<BulkImportResult.RowError> errors = new ArrayList<>();

        for (CSVRecord record : records) {
            int rowNum = (int) record.getRecordNumber() + 1;
            try {
                PermitRequest request = new PermitRequest();
                String facilityIdStr = CsvImportSupport.get(record, "facilityId");
                request.setFacilityId(facilityIdStr == null ? null : Long.valueOf(facilityIdStr));
                request.setPermitNumber(CsvImportSupport.get(record, "permitNumber"));
                String type = CsvImportSupport.get(record, "permitType");
                request.setPermitType(type == null ? null : PermitType.valueOf(type.toUpperCase()));
                String status = CsvImportSupport.get(record, "status");
                request.setStatus(status == null ? null : PermitStatus.valueOf(status.toUpperCase()));
                request.setDescription(CsvImportSupport.get(record, "description"));
                String issued = CsvImportSupport.get(record, "issuedDate");
                request.setIssuedDate(issued == null ? null : LocalDate.parse(issued));
                String expiration = CsvImportSupport.get(record, "expirationDate");
                request.setExpirationDate(expiration == null ? null : LocalDate.parse(expiration));

                String validationError = CsvImportSupport.validate(validator, request);
                if (validationError != null) {
                    errors.add(BulkImportResult.RowError.builder().row(rowNum).message(validationError).build());
                    skipped++;
                    continue;
                }
                Facility facility = facilityService.getEntity(request.getFacilityId());

                Permit existing = findExisting(CsvImportSupport.get(record, "id"), request.getPermitNumber());
                if (existing != null) {
                    existing.setFacility(facility);
                    apply(existing, request);
                    permitRepository.save(existing);
                    updated++;
                } else {
                    Permit permit = new Permit();
                    permit.setFacility(facility);
                    apply(permit, request);
                    permitRepository.save(permit);
                    created++;
                }
            } catch (Exception e) {
                errors.add(BulkImportResult.RowError.builder().row(rowNum).message(e.getMessage()).build());
                skipped++;
            }
        }
        return BulkImportResult.builder().created(created).updated(updated).skipped(skipped).errors(errors).build();
    }

    private Permit findExisting(String idColumn, String permitNumber) {
        if (idColumn != null) {
            return permitRepository.findById(Long.parseLong(idColumn)).orElse(null);
        }
        return permitRepository.findByPermitNumberIgnoreCase(permitNumber).orElse(null);
    }
}

package com.example.bffkickstart.service;

import com.example.bffkickstart.csv.CsvImportSupport;
import com.example.bffkickstart.domain.Facility;
import com.example.bffkickstart.domain.FacilityType;
import com.example.bffkickstart.dto.BulkImportResult;
import com.example.bffkickstart.dto.FacilityRequest;
import com.example.bffkickstart.dto.FacilityResponse;
import com.example.bffkickstart.dto.PageResponse;
import com.example.bffkickstart.exception.ConflictException;
import com.example.bffkickstart.exception.NotFoundException;
import com.example.bffkickstart.repository.FacilityRepository;
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
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class FacilityService {

    private static final List<String> CSV_HEADERS =
            List.of("id", "name", "facilityType", "addressLine1", "city", "state", "zip", "active");

    private final FacilityRepository facilityRepository;
    private final Validator validator;

    public FacilityService(FacilityRepository facilityRepository, Validator validator) {
        this.facilityRepository = facilityRepository;
        this.validator = validator;
    }

    @Transactional(readOnly = true)
    public PageResponse<FacilityResponse> search(String q, FacilityType type, Boolean active, Pageable pageable) {
        Specification<Facility> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String like = "%" + q.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("city")), like)
                ));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("facilityType"), type));
            }
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<Facility> page = facilityRepository.findAll(spec, pageable);
        return PageResponse.of(page, FacilityResponse::from);
    }

    @Transactional(readOnly = true)
    public FacilityResponse getById(Long id) {
        return FacilityResponse.from(getEntity(id));
    }

    Facility getEntity(Long id) {
        return facilityRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Facility %d not found".formatted(id)));
    }

    public FacilityResponse create(FacilityRequest request) {
        if (facilityRepository.existsByNameIgnoreCase(request.getName())) {
            throw new ConflictException("A facility named '%s' already exists".formatted(request.getName()));
        }
        Facility facility = new Facility();
        apply(facility, request);
        return FacilityResponse.from(facilityRepository.save(facility));
    }

    public FacilityResponse update(Long id, FacilityRequest request) {
        Facility facility = getEntity(id);
        if (!facility.getName().equalsIgnoreCase(request.getName())
                && facilityRepository.existsByNameIgnoreCase(request.getName())) {
            throw new ConflictException("A facility named '%s' already exists".formatted(request.getName()));
        }
        apply(facility, request);
        return FacilityResponse.from(facilityRepository.save(facility));
    }

    public void delete(Long id) {
        Facility facility = getEntity(id);
        facilityRepository.delete(facility);
    }

    private void apply(Facility facility, FacilityRequest request) {
        facility.setName(request.getName());
        facility.setFacilityType(request.getFacilityType());
        facility.setAddressLine1(request.getAddressLine1());
        facility.setCity(request.getCity());
        facility.setState(request.getState().toUpperCase());
        facility.setZip(request.getZip());
        facility.setActive(request.isActive());
    }

    @Transactional(readOnly = true)
    public void writeCsv(OutputStream out) throws IOException {
        try (CSVPrinter printer = new CSVPrinter(
                new OutputStreamWriter(out, StandardCharsets.UTF_8),
                CSVFormat.DEFAULT.builder().setHeader(CSV_HEADERS.toArray(new String[0])).get())) {
            for (Facility f : facilityRepository.findAll()) {
                printer.printRecord(f.getId(), f.getName(), f.getFacilityType(), f.getAddressLine1(),
                        f.getCity(), f.getState(), f.getZip(), f.isActive());
            }
        }
    }

    /**
     * Upserts: a row with an "id" column is looked up by id only (see {@link #findExisting} - a
     * stale or unrecognized id does *not* fall back to a name match, it's treated as no match and
     * creates a new row); a row with no "id" column falls back to a case-insensitive name match
     * (the same natural key create()/update() enforce), so re-importing a previously exported file
     * edits existing rows instead of duplicating them.
     */
    public BulkImportResult importCsv(MultipartFile file) throws IOException {
        List<CSVRecord> records = CsvImportSupport.parse(file.getInputStream());
        int created = 0;
        int updated = 0;
        int skipped = 0;
        List<BulkImportResult.RowError> errors = new ArrayList<>();

        for (CSVRecord record : records) {
            int rowNum = (int) record.getRecordNumber() + 1;
            try {
                FacilityRequest request = new FacilityRequest();
                request.setName(CsvImportSupport.get(record, "name"));
                String type = CsvImportSupport.get(record, "facilityType");
                request.setFacilityType(type == null ? null : FacilityType.valueOf(type.toUpperCase()));
                request.setAddressLine1(CsvImportSupport.get(record, "addressLine1"));
                request.setCity(CsvImportSupport.get(record, "city"));
                String state = CsvImportSupport.get(record, "state");
                request.setState(state == null ? null : state.toUpperCase());
                request.setZip(CsvImportSupport.get(record, "zip"));
                String active = CsvImportSupport.get(record, "active");
                request.setActive(active == null || Boolean.parseBoolean(active));

                String validationError = CsvImportSupport.validate(validator, request);
                if (validationError != null) {
                    errors.add(BulkImportResult.RowError.builder().row(rowNum).message(validationError).build());
                    skipped++;
                    continue;
                }

                Facility existing = findExisting(CsvImportSupport.get(record, "id"), request.getName());
                if (existing != null) {
                    apply(existing, request);
                    facilityRepository.save(existing);
                    updated++;
                } else {
                    Facility facility = new Facility();
                    apply(facility, request);
                    facilityRepository.save(facility);
                    created++;
                }
            } catch (Exception e) {
                errors.add(BulkImportResult.RowError.builder().row(rowNum).message(e.getMessage()).build());
                skipped++;
            }
        }
        return BulkImportResult.builder().created(created).updated(updated).skipped(skipped).errors(errors).build();
    }

    private Facility findExisting(String idColumn, String name) {
        if (idColumn != null) {
            return facilityRepository.findById(Long.parseLong(idColumn)).orElse(null);
        }
        return facilityRepository.findByNameIgnoreCase(name).orElse(null);
    }
}

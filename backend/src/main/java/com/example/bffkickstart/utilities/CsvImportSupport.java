package com.example.bffkickstart.utilities;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** Shared plumbing for the bulk-import endpoints - each service still owns its own row-to-entity mapping. */
public final class CsvImportSupport {

    private CsvImportSupport() {
    }

    public static List<CSVRecord> parse(InputStream in) throws IOException {
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreSurroundingSpaces(true)
                .setTrim(true)
                .get();
        try (CSVParser parser = CSVParser.builder()
                .setReader(new InputStreamReader(in, StandardCharsets.UTF_8))
                .setFormat(format)
                .get()) {
            return parser.getRecords();
        }
    }

    /** Blank cells round-trip as "" from most spreadsheet tools - normalize those to null like the rest of the app expects. */
    public static String get(CSVRecord record, String column) {
        if (!record.isMapped(column)) {
            return null;
        }
        String value = record.get(column);
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    /** Returns a single "field: message; field: message" string, or null if the bean is valid. */
    public static <T> String validate(Validator validator, T bean) {
        Set<ConstraintViolation<T>> violations = validator.validate(bean);
        if (violations.isEmpty()) {
            return null;
        }
        return violations.stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(Collectors.joining("; "));
    }
}

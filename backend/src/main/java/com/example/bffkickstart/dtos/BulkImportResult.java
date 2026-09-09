package com.example.bffkickstart.dtos;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class BulkImportResult {
    private int created;
    private int updated;
    private int skipped;
    private List<RowError> errors;

    @Getter
    @Builder
    public static class RowError {
        /** 1-based, counting the header row as row 1 so it matches what a spreadsheet shows. */
        private int row;
        private String message;
    }
}

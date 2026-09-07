package com.example.bffkickstart.reporting.web;

import com.example.bffkickstart.reporting.dto.DailyReportResponse;
import com.example.bffkickstart.reporting.repository.DailyReportRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/daily-reports")
@PreAuthorize("hasAnyRole('Admin','Inspector','Viewer')")
public class DailyReportController {

    private final DailyReportRepository dailyReportRepository;

    public DailyReportController(DailyReportRepository dailyReportRepository) {
        this.dailyReportRepository = dailyReportRepository;
    }

    @GetMapping
    public List<DailyReportResponse> list() {
        return dailyReportRepository.findAllByOrderByReportDateDesc().stream()
                .map(DailyReportResponse::from)
                .toList();
    }
}

package com.example.bffkickstart.reporting.repository;

import com.example.bffkickstart.reporting.domain.DailyReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DailyReportRepository extends JpaRepository<DailyReport, Long> {
    List<DailyReport> findAllByOrderByReportDateDesc();
}

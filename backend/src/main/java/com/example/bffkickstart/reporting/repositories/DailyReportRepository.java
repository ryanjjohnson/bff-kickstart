package com.example.bffkickstart.reporting.repositories;

import com.example.bffkickstart.reporting.models.DailyReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DailyReportRepository extends JpaRepository<DailyReport, Long> {
    List<DailyReport> findAllByOrderByReportDateDesc();
}

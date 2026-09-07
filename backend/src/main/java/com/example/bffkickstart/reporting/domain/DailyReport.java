package com.example.bffkickstart.reporting.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A daily rollup fact table in the "data warehouse" datasource (db.kickstart-rpt) - deliberately
 * separate from the primary transactional datasource's own Facility/Permit/Inspection entities.
 */
@Entity
@Table(name = "daily_reports")
@Getter
@Setter
@NoArgsConstructor
public class DailyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_date", nullable = false, unique = true)
    private LocalDate reportDate;

    @Column(name = "facilities_active_count", nullable = false)
    private int facilitiesActiveCount;

    @Column(name = "new_permits_issued_count", nullable = false)
    private int newPermitsIssuedCount;

    @Column(name = "permits_expiring_soon_count", nullable = false)
    private int permitsExpiringSoonCount;

    @Column(name = "inspections_completed_count", nullable = false)
    private int inspectionsCompletedCount;

    @Column(name = "inspections_passed_count", nullable = false)
    private int inspectionsPassedCount;

    @Column(name = "inspections_failed_count", nullable = false)
    private int inspectionsFailedCount;

    @Column(name = "compliance_rate_pct", nullable = false, precision = 5, scale = 1)
    private BigDecimal complianceRatePct;
}

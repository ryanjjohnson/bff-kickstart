insert into facility (name, facility_type, address_line1, city, state, zip, active) values
    ('Widget Works Assembly Plant', 'ASSEMBLY', '100 Industrial Way', 'Springfield', 'OH', '45501', true),
    ('Precision Gizmo Fabrication', 'FABRICATION', '450 Foundry Rd', 'Rivertown', 'OH', '45610', true),
    ('QualityFirst Inspection Lab', 'QUALITY_CONTROL', '77 Testing Ave', 'Millbrook', 'OH', '45505', true),
    ('Bolt & Gear Co-op', 'PACKAGING', '900 Component Blvd', 'Lakeview', 'OH', '45620', true),
    ('Harborview Gizmo Exports', 'OTHER', '12 Dock St', 'Portside', 'OH', '45630', false);

insert into permit (facility_id, permit_number, permit_type, status, description, issued_date, expiration_date) values
    (1, 'SAFETY-2024-00123', 'SAFETY', 'ISSUED', 'Machine guarding & safety permit for assembly line', '2024-01-15', '2027-01-15'),
    (1, 'QUALITY-2023-00987', 'QUALITY', 'EXPIRED', 'ISO quality certification permit', '2020-06-01', '2023-06-01'),
    (2, 'ELECTRICAL-2024-00456', 'ELECTRICAL', 'ISSUED', 'Electrical systems permit for fabrication equipment', '2024-03-01', '2026-11-30'),
    (3, 'QUALITY-2024-00789', 'QUALITY', 'PENDING_REVIEW', 'Quality control lab certification renewal', null, null),
    (4, 'PACKAGING-2022-00321', 'PACKAGING', 'ISSUED', 'Packaging line operating permit', '2022-05-10', '2025-10-01'),
    (5, 'EXPORT-2021-00111', 'EXPORT', 'REVOKED', 'Export shipping permit (revoked for violations)', '2021-02-01', '2024-02-01');

insert into inspection (facility_id, permit_id, inspector_name, scheduled_date, completed_date, outcome, notes) values
    (1, 1, 'Ivan Inspector', '2024-02-01', '2024-02-01', 'PASSED', 'Machine guarding checks within safety limits.'),
    (1, 2, 'Ivan Inspector', '2023-05-15', '2023-05-15', 'FAILED', 'Improper quality documentation found.'),
    (2, 3, 'Ivan Inspector', '2024-09-01', '2024-09-02', 'PASSED', 'Electrical inspection within permitted parameters.'),
    (3, 4, 'Ivan Inspector', '2026-10-01', null, 'PENDING', 'Awaiting certification renewal decision before inspection.'),
    (4, 5, 'Ivan Inspector', '2025-01-20', '2025-01-22', 'NEEDS_FOLLOWUP', 'Minor packaging line issue, re-inspect in 90 days.'),
    (5, 6, 'Ivan Inspector', '2024-01-10', '2024-01-10', 'FAILED', 'Unauthorized export shipment observed; permit revoked.');

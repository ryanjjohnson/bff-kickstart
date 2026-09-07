// Cross-feature type imports go through the sibling feature's index.ts, same
// as any other cross-feature import - never a direct path into its internals.
import type { PermitStatus, PermitType } from '../../permits';
import type { InspectionOutcome } from '../../inspections';

export interface ComplianceReportRow {
  facilityName: string;
  city: string;
  permitNumber: string;
  permitType: PermitType;
  status: PermitStatus;
  expirationDate?: string;
  daysUntilExpiration?: number;
  lastInspectionOutcome?: InspectionOutcome;
  lastInspectionDate?: string;
}

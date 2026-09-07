export interface DailyReportResponse {
  id: number;
  reportDate: string;
  facilitiesActiveCount: number;
  newPermitsIssuedCount: number;
  permitsExpiringSoonCount: number;
  inspectionsCompletedCount: number;
  inspectionsPassedCount: number;
  inspectionsFailedCount: number;
  complianceRatePct: number;
}

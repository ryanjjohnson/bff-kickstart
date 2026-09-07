import { Chip, Spinner, Table } from '@heroui/react';
import { useDailyReports } from '../hooks/useDailyReports';

export function DailyReportsPage() {
  const { data: rows, isLoading } = useDailyReports();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Daily Reports</h1>
        <p className="text-sm text-muted">
          Daily rollup metrics from the data warehouse - facilities, permits, and inspection
          activity by day.
        </p>
      </div>

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Daily reports">
            <Table.Header>
              <Table.Column>Date</Table.Column>
              <Table.Column>Active Facilities</Table.Column>
              <Table.Column>New Permits</Table.Column>
              <Table.Column>Expiring Soon</Table.Column>
              <Table.Column>Inspections</Table.Column>
              <Table.Column>Passed</Table.Column>
              <Table.Column>Failed</Table.Column>
              <Table.Column>Compliance Rate</Table.Column>
            </Table.Header>
            <Table.Body
              items={rows ?? []}
              renderEmptyState={() =>
                isLoading ? (
                  <div className="flex justify-center py-10">
                    <Spinner />
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm text-muted">No daily reports found.</div>
                )
              }
            >
              {(row) => (
                <Table.Row key={row.id} id={row.id}>
                  <Table.Cell>{row.reportDate}</Table.Cell>
                  <Table.Cell>{row.facilitiesActiveCount}</Table.Cell>
                  <Table.Cell>{row.newPermitsIssuedCount}</Table.Cell>
                  <Table.Cell>{row.permitsExpiringSoonCount}</Table.Cell>
                  <Table.Cell>{row.inspectionsCompletedCount}</Table.Cell>
                  <Table.Cell>{row.inspectionsPassedCount}</Table.Cell>
                  <Table.Cell>{row.inspectionsFailedCount}</Table.Cell>
                  <Table.Cell>
                    <Chip size="sm" color={row.complianceRatePct >= 80 ? 'success' : row.complianceRatePct >= 50 ? 'warning' : 'danger'}>
                      {row.complianceRatePct.toFixed(1)}%
                    </Chip>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}

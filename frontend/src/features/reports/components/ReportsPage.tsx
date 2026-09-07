import { Button, Chip, Spinner, Table } from '@heroui/react';
import { PERMIT_STATUS_COLORS } from '../../permits';
import { INSPECTION_OUTCOME_COLORS } from '../../inspections';
import { FRONTEND_BASE_PATH } from '../../../lib/config';
import { useComplianceReport } from '../hooks/useComplianceReport';

export function ReportsPage() {
  const { data: rows, isLoading } = useComplianceReport();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Compliance Report</h1>
          <p className="text-sm text-muted">
            Every permit, its expiration status, and its most recent inspection outcome.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onPress={() => window.location.assign(`${FRONTEND_BASE_PATH}/api/v1/reports/compliance/csv`)}
          >
            Download CSV
          </Button>
          <Button onPress={() => window.location.assign(`${FRONTEND_BASE_PATH}/api/v1/reports/compliance/pdf`)}>
            Download PDF
          </Button>
        </div>
      </div>

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Permit compliance report">
            <Table.Header>
              <Table.Column>Facility</Table.Column>
              <Table.Column>City</Table.Column>
              <Table.Column>Permit #</Table.Column>
              <Table.Column>Type</Table.Column>
              <Table.Column>Status</Table.Column>
              <Table.Column>Expires</Table.Column>
              <Table.Column>Days Left</Table.Column>
              <Table.Column>Last Inspection</Table.Column>
            </Table.Header>
            <Table.Body
              items={rows ?? []}
              renderEmptyState={() =>
                isLoading ? (
                  <div className="flex justify-center py-10">
                    <Spinner />
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm text-muted">No permits found.</div>
                )
              }
            >
              {(row) => (
                <Table.Row key={row.permitNumber} id={row.permitNumber}>
                  <Table.Cell>{row.facilityName}</Table.Cell>
                  <Table.Cell>{row.city}</Table.Cell>
                  <Table.Cell>{row.permitNumber}</Table.Cell>
                  <Table.Cell>{row.permitType}</Table.Cell>
                  <Table.Cell>
                    <Chip size="sm" color={PERMIT_STATUS_COLORS[row.status]}>
                      {row.status.replace('_', ' ')}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>{row.expirationDate ?? '—'}</Table.Cell>
                  <Table.Cell>
                    {row.daysUntilExpiration == null
                      ? '—'
                      : row.daysUntilExpiration < 0
                        ? `${Math.abs(row.daysUntilExpiration)}d overdue`
                        : `${row.daysUntilExpiration}d`}
                  </Table.Cell>
                  <Table.Cell>
                    {row.lastInspectionOutcome ? (
                      <Chip size="sm" color={INSPECTION_OUTCOME_COLORS[row.lastInspectionOutcome]}>
                        {row.lastInspectionOutcome.replace('_', ' ')}
                      </Chip>
                    ) : (
                      '—'
                    )}
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

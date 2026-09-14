import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Chip, Spinner, Table } from '@heroui/react';
import { FACILITY_TYPE_LABELS } from '../types/facility';
import { useFacility } from '../hooks/useFacilities';
import { PERMIT_STATUS_COLORS, useAllPermitsForFacility } from '../../permits';
import { INSPECTION_OUTCOME_COLORS, useInspections } from '../../inspections';
import { useComplianceReport } from '../../reports';

/**
 * Read-only overview for a single facility, reached from the "Overview" action
 * on the Facilities table (/facilities/:id). Pulls the facility's own permits,
 * inspections, and compliance rows together on one page - each sourced from its
 * owning feature through that feature's public surface (index.ts), never a
 * direct reach into its internals.
 */
export function FacilityOverviewPage() {
  const { id } = useParams();
  const facilityId = Number(id);
  const validId = Number.isInteger(facilityId) && facilityId > 0;

  const { data: facility, isLoading, isError } = useFacility(facilityId);
  const { data: permits, isLoading: permitsLoading } = useAllPermitsForFacility(validId ? facilityId : null);
  const { data: inspectionsPage, isLoading: inspectionsLoading } = useInspections({
    facilityId: validId ? facilityId : undefined,
    page: 0,
    size: 100,
  });
  const { data: reportRows, isLoading: reportsLoading } = useComplianceReport();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!validId || isError || !facility) {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold">Facility not found</h1>
        <p className="text-sm text-muted">
          This facility doesn&apos;t exist or may have been deleted.
        </p>
        <Link to="/facilities" className="text-sm font-medium text-accent hover:underline">
          ← Back to facilities
        </Link>
      </div>
    );
  }

  const inspections = inspectionsPage?.content ?? [];
  // Compliance rows carry only the facility name (no id), so match on that.
  const facilityReportRows = (reportRows ?? []).filter((r) => r.facilityName === facility.name);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link to="/facilities" className="text-sm font-medium text-accent hover:underline">
          ← Facilities
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{facility.name}</h1>
          <Chip size="sm" color="default">
            {FACILITY_TYPE_LABELS[facility.facilityType]}
          </Chip>
          <Chip size="sm" color={facility.active ? 'success' : 'default'}>
            {facility.active ? 'Active' : 'Inactive'}
          </Chip>
        </div>
        <p className="text-sm text-muted">
          {facility.addressLine1}, {facility.city}, {facility.state} {facility.zip}
          {facility.latitude != null && facility.longitude != null && (
            <> · {facility.latitude.toFixed(5)}, {facility.longitude.toFixed(5)}</>
          )}
        </p>
      </div>

      <Section title="Permits" count={permits?.length} isLoading={permitsLoading}>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label={`Permits for ${facility.name}`}>
              <Table.Header>
                <Table.Column isRowHeader>Permit #</Table.Column>
                <Table.Column>Type</Table.Column>
                <Table.Column>Status</Table.Column>
                <Table.Column>Expires</Table.Column>
              </Table.Header>
              <Table.Body
                items={permits ?? []}
                renderEmptyState={() => <EmptyRow loading={permitsLoading} label="No permits for this facility." />}
              >
                {(permit) => (
                  <Table.Row key={permit.id} id={permit.id}>
                    <Table.Cell>
                      <span className="font-medium">{permit.permitNumber}</span>
                    </Table.Cell>
                    <Table.Cell>{permit.permitType}</Table.Cell>
                    <Table.Cell>
                      <Chip size="sm" color={PERMIT_STATUS_COLORS[permit.status]}>
                        {permit.status.replace('_', ' ')}
                      </Chip>
                    </Table.Cell>
                    <Table.Cell>{permit.expirationDate ?? '—'}</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Section>

      <Section title="Inspections" count={inspections.length} isLoading={inspectionsLoading}>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label={`Inspections for ${facility.name}`}>
              <Table.Header>
                <Table.Column isRowHeader>Inspector</Table.Column>
                <Table.Column>Scheduled</Table.Column>
                <Table.Column>Permit</Table.Column>
                <Table.Column>Outcome</Table.Column>
              </Table.Header>
              <Table.Body
                items={inspections}
                renderEmptyState={() =>
                  <EmptyRow loading={inspectionsLoading} label="No inspections for this facility." />
                }
              >
                {(inspection) => (
                  <Table.Row key={inspection.id} id={inspection.id}>
                    <Table.Cell>
                      <span className="font-medium">{inspection.inspectorName}</span>
                    </Table.Cell>
                    <Table.Cell>{inspection.scheduledDate}</Table.Cell>
                    <Table.Cell>{inspection.permitNumber ?? '—'}</Table.Cell>
                    <Table.Cell>
                      <Chip size="sm" color={INSPECTION_OUTCOME_COLORS[inspection.outcome]}>
                        {inspection.outcome.replace('_', ' ')}
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Section>

      <Section title="Compliance" count={facilityReportRows.length} isLoading={reportsLoading}>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label={`Compliance report for ${facility.name}`}>
              <Table.Header>
                <Table.Column isRowHeader>Permit #</Table.Column>
                <Table.Column>Status</Table.Column>
                <Table.Column>Expires</Table.Column>
                <Table.Column>Days Left</Table.Column>
                <Table.Column>Last Inspection</Table.Column>
              </Table.Header>
              <Table.Body
                items={facilityReportRows}
                renderEmptyState={() =>
                  <EmptyRow loading={reportsLoading} label="No compliance rows for this facility." />
                }
              >
                {(row) => (
                  <Table.Row key={row.permitNumber} id={row.permitNumber}>
                    <Table.Cell>
                      <span className="font-medium">{row.permitNumber}</span>
                    </Table.Cell>
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
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  isLoading,
  children,
}: {
  title: string;
  count?: number;
  isLoading?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">
        {title}
        {!isLoading && count != null && <span className="ml-2 text-sm font-normal text-muted">({count})</span>}
      </h2>
      {children}
    </section>
  );
}

function EmptyRow({ loading, label }: { loading?: boolean; label: string }) {
  return loading ? (
    <div className="flex justify-center py-8">
      <Spinner />
    </div>
  ) : (
    <div className="py-8 text-center text-sm text-muted">{label}</div>
  );
}

import { useState } from 'react';
import { Button, Chip, Input, Modal, toast, useOverlayState } from '@heroui/react';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog';
import { FilterSelect } from '../../../components/FilterSelect';
import { BulkActions } from '../../../components/BulkActions';
import { useAuth } from '../../../auth/AuthContext';
import { showActionError } from '../../../lib/api-client';
import { useSort } from '../../../lib/useSort';
import { useAllFacilities } from '../../facilities';
import {
  INSPECTION_OUTCOMES,
  INSPECTION_OUTCOME_COLORS,
  type InspectionFormValues,
  type InspectionOutcome,
  type InspectionResponse,
} from '../types/inspection';
import { exportInspectionsCsv, importInspectionsCsv } from '../api/inspections';
import { useCreateInspection, useDeleteInspection, useInspections, useUpdateInspection } from '../hooks/useInspections';
import { InspectionAttachments } from './InspectionAttachments';
import { InspectionForm } from './InspectionForm';

const PAGE_SIZE = 10;

const outcomeFilterOptions = INSPECTION_OUTCOMES.map((o) => ({ value: o, label: o.replace('_', ' ') }));

export function InspectionsPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('Admin', 'Inspector');
  const canManageData = hasRole('Data Manager');

  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [facilityId, setFacilityId] = useState<number | undefined>();
  const [outcome, setOutcome] = useState<InspectionOutcome | ''>('');
  const { sortBy, sortDir, onSortChange, sortParam } = useSort();

  const { data: facilities } = useAllFacilities();
  const { data, isLoading, refetch } = useInspections({
    page,
    size: PAGE_SIZE,
    q,
    facilityId,
    outcome,
    sort: sortParam,
  });

  const [editing, setEditing] = useState<InspectionResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const formModal = useOverlayState({ onOpenChange: (open) => !open && setEditing(null) });

  const [deleteTarget, setDeleteTarget] = useState<InspectionResponse | null>(null);
  const deleteDialog = useOverlayState({ onOpenChange: (open) => !open && setDeleteTarget(null) });

  const createInspection = useCreateInspection();
  const updateInspection = useUpdateInspection(editing?.id ?? -1);
  const deleteInspection = useDeleteInspection();

  function openCreate() {
    setIsCreating(true);
    setEditing(null);
    formModal.open();
  }

  function openEdit(inspection: InspectionResponse) {
    setIsCreating(false);
    setEditing(inspection);
    formModal.open();
  }

  function handleSubmit(values: InspectionFormValues) {
    const mutation = isCreating ? createInspection : updateInspection;
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success(isCreating ? 'Inspection created' : 'Inspection updated');
        formModal.close();
      },
      onError: (err) => showActionError(err, 'Something went wrong'),
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteInspection.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Inspection deleted');
        deleteDialog.close();
      },
      onError: (err) => showActionError(err, 'Something went wrong'),
    });
  }

  const columns: DataTableColumn<InspectionResponse>[] = [
    { key: 'facility', header: 'Facility', render: (i) => <span className="font-medium">{i.facilityName}</span> },
    { key: 'permit', header: 'Permit', render: (i) => i.permitNumber ?? '—' },
    { key: 'inspectorName', header: 'Inspector', sortable: true, render: (i) => i.inspectorName },
    { key: 'scheduledDate', header: 'Scheduled', sortable: true, render: (i) => i.scheduledDate },
    {
      key: 'outcome',
      header: 'Outcome',
      sortable: true,
      render: (i) => (
        <Chip size="sm" color={INSPECTION_OUTCOME_COLORS[i.outcome]}>
          {i.outcome.replace('_', ' ')}
        </Chip>
      ),
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: '',
            render: (i: InspectionResponse) => (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onPress={() => openEdit(i)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setDeleteTarget(i);
                    deleteDialog.open();
                  }}
                >
                  Delete
                </Button>
              </div>
            ),
          } satisfies DataTableColumn<InspectionResponse>,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inspections</h1>
          <p className="text-sm text-muted">Compliance inspections performed at facilities.</p>
        </div>
        <div className="flex gap-2">
          {canManageData && (
            <BulkActions
              onExport={exportInspectionsCsv}
              onImport={importInspectionsCsv}
              onImported={() => refetch()}
              exportFilename="inspections.csv"
            />
          )}
          {canEdit && <Button onPress={openCreate}>New Inspection</Button>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by inspector or notes…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          className="max-w-sm"
        />
        <FilterSelect
          value={facilityId != null ? String(facilityId) : ''}
          onChange={(v) => {
            setFacilityId(v === '' ? undefined : Number(v));
            setPage(0);
          }}
          options={(facilities ?? []).map((f) => ({ value: String(f.id), label: f.name }))}
          placeholder="Facility"
          allLabel="All facilities"
          className="w-56"
        />
        <FilterSelect
          value={outcome}
          onChange={(v) => {
            setOutcome(v as InspectionOutcome | '');
            setPage(0);
          }}
          options={outcomeFilterOptions}
          placeholder="Outcome"
          allLabel="All outcomes"
          className="w-52"
        />
      </div>

      <DataTable
        aria-label="Inspections"
        columns={columns}
        rows={data?.content ?? []}
        isLoading={isLoading}
        page={data?.page ?? 0}
        totalPages={data?.totalPages ?? 0}
        totalElements={data?.totalElements ?? 0}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={onSortChange}
        emptyMessage="No inspections found."
      />

      <Modal.Backdrop isOpen={formModal.isOpen} onOpenChange={formModal.setOpen}>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{isCreating ? 'New Inspection' : 'Edit Inspection'}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <InspectionForm
                key={editing?.id ?? 'new'}
                defaultValues={editing ?? undefined}
                onSubmit={handleSubmit}
                onCancel={formModal.close}
                isSubmitting={createInspection.isPending || updateInspection.isPending}
                serverError={createInspection.error ?? updateInspection.error}
              />
              {editing ? (
                <div className="mt-4">
                  <InspectionAttachments inspectionId={editing.id} canEdit={canEdit} />
                </div>
              ) : (
                <p className="mt-4 border-t border-default-200 pt-3 text-xs text-muted">
                  Save the inspection first to add file or photo attachments.
                </p>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <ConfirmDeleteDialog
        isOpen={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete inspection?"
        description="This will permanently delete this inspection record."
        onConfirm={handleDelete}
        isPending={deleteInspection.isPending}
      />
    </div>
  );
}

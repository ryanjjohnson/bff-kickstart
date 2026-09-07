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
  PERMIT_STATUSES,
  PERMIT_STATUS_COLORS,
  PERMIT_TYPES,
  type PermitFormValues,
  type PermitResponse,
  type PermitStatus,
  type PermitType,
} from '../types/permit';
import { exportPermitsCsv, importPermitsCsv } from '../api/permits';
import { useCreatePermit, useDeletePermit, usePermits, useUpdatePermit } from '../hooks/usePermits';
import { PermitForm } from './PermitForm';

const PAGE_SIZE = 10;

const typeFilterOptions = PERMIT_TYPES.map((t) => ({ value: t, label: t }));
const statusFilterOptions = PERMIT_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }));

export function PermitsPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('Admin');
  const canManageData = hasRole('Data Manager');

  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [facilityId, setFacilityId] = useState<number | undefined>();
  const [status, setStatus] = useState<PermitStatus | ''>('');
  const [type, setType] = useState<PermitType | ''>('');
  const { sortBy, sortDir, onSortChange, sortParam } = useSort();

  const { data: facilities } = useAllFacilities();
  const { data, isLoading, refetch } = usePermits({
    page,
    size: PAGE_SIZE,
    q,
    facilityId,
    status,
    type,
    sort: sortParam,
  });

  const [editing, setEditing] = useState<PermitResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const formModal = useOverlayState({ onOpenChange: (open) => !open && setEditing(null) });

  const [deleteTarget, setDeleteTarget] = useState<PermitResponse | null>(null);
  const deleteDialog = useOverlayState({ onOpenChange: (open) => !open && setDeleteTarget(null) });

  const createPermit = useCreatePermit();
  const updatePermit = useUpdatePermit(editing?.id ?? -1);
  const deletePermit = useDeletePermit();

  function openCreate() {
    setIsCreating(true);
    setEditing(null);
    formModal.open();
  }

  function openEdit(permit: PermitResponse) {
    setIsCreating(false);
    setEditing(permit);
    formModal.open();
  }

  function handleSubmit(values: PermitFormValues) {
    const mutation = isCreating ? createPermit : updatePermit;
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success(isCreating ? 'Permit created' : 'Permit updated');
        formModal.close();
      },
      onError: (err) => showActionError(err, 'Something went wrong'),
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deletePermit.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Permit deleted');
        deleteDialog.close();
      },
      onError: (err) => showActionError(err, 'Something went wrong'),
    });
  }

  const columns: DataTableColumn<PermitResponse>[] = [
    {
      key: 'permitNumber',
      header: 'Permit #',
      sortable: true,
      render: (p) => <span className="font-medium">{p.permitNumber}</span>,
    },
    { key: 'facility', header: 'Facility', render: (p) => p.facilityName },
    { key: 'permitType', header: 'Type', sortable: true, render: (p) => p.permitType },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (p) => (
        <Chip size="sm" color={PERMIT_STATUS_COLORS[p.status]}>
          {p.status.replace('_', ' ')}
        </Chip>
      ),
    },
    { key: 'expirationDate', header: 'Expires', sortable: true, render: (p) => p.expirationDate ?? '—' },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: '',
            render: (p: PermitResponse) => (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onPress={() => openEdit(p)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setDeleteTarget(p);
                    deleteDialog.open();
                  }}
                >
                  Delete
                </Button>
              </div>
            ),
          } satisfies DataTableColumn<PermitResponse>,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Permits</h1>
          <p className="text-sm text-muted">Manufacturing permits issued to facilities.</p>
        </div>
        <div className="flex gap-2">
          {canManageData && (
            <BulkActions
              onExport={exportPermitsCsv}
              onImport={importPermitsCsv}
              onImported={() => refetch()}
              exportFilename="permits.csv"
            />
          )}
          {canEdit && <Button onPress={openCreate}>New Permit</Button>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by permit number or description…"
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
          value={type}
          onChange={(v) => {
            setType(v as PermitType | '');
            setPage(0);
          }}
          options={typeFilterOptions}
          placeholder="Type"
          allLabel="All types"
          className="w-44"
        />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v as PermitStatus | '');
            setPage(0);
          }}
          options={statusFilterOptions}
          placeholder="Status"
          allLabel="All statuses"
          className="w-52"
        />
      </div>

      <DataTable
        aria-label="Permits"
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
        emptyMessage="No permits found."
      />

      <Modal.Backdrop isOpen={formModal.isOpen} onOpenChange={formModal.setOpen}>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{isCreating ? 'New Permit' : 'Edit Permit'}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <PermitForm
                key={editing?.id ?? 'new'}
                defaultValues={editing ?? undefined}
                onSubmit={handleSubmit}
                onCancel={formModal.close}
                isSubmitting={createPermit.isPending || updatePermit.isPending}
                serverError={createPermit.error ?? updatePermit.error}
              />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <ConfirmDeleteDialog
        isOpen={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete permit?"
        description={`This will permanently delete permit "${deleteTarget?.permitNumber}".`}
        onConfirm={handleDelete}
        isPending={deletePermit.isPending}
      />
    </div>
  );
}

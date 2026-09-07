import { useState } from 'react';
import { Button, Chip, Input, Modal, useOverlayState } from '@heroui/react';
import { toast } from '@heroui/react';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog';
import { FilterSelect } from '../../../components/FilterSelect';
import { BulkActions } from '../../../components/BulkActions';
import { useAuth } from '../../../auth/AuthContext';
import { showActionError } from '../../../lib/api-client';
import { useSort } from '../../../lib/useSort';
import {
  FACILITY_TYPES,
  FACILITY_TYPE_LABELS,
  type FacilityFormValues,
  type FacilityResponse,
} from '../types/facility';
import { exportFacilitiesCsv, importFacilitiesCsv } from '../api/facilities';
import { useCreateFacility, useDeleteFacility, useFacilities, useUpdateFacility } from '../hooks/useFacilities';
import { FacilityForm } from './FacilityForm';

const PAGE_SIZE = 10;

const typeFilterOptions = FACILITY_TYPES.map((t) => ({ value: t, label: FACILITY_TYPE_LABELS[t] }));
const activeFilterOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export function FacilitiesPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('Admin');
  const canManageData = hasRole('Data Manager');

  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [active, setActive] = useState('');
  const { sortBy, sortDir, onSortChange, sortParam } = useSort();

  const { data, isLoading, refetch } = useFacilities({
    page,
    size: PAGE_SIZE,
    q,
    type: type as (typeof FACILITY_TYPES)[number] | '',
    active: active === '' ? undefined : active === 'true',
    sort: sortParam,
  });

  const [editing, setEditing] = useState<FacilityResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const formModal = useOverlayState({ onOpenChange: (open) => !open && setEditing(null) });

  const [deleteTarget, setDeleteTarget] = useState<FacilityResponse | null>(null);
  const deleteDialog = useOverlayState({ onOpenChange: (open) => !open && setDeleteTarget(null) });

  const createFacility = useCreateFacility();
  const updateFacility = useUpdateFacility(editing?.id ?? -1);
  const deleteFacility = useDeleteFacility();

  function openCreate() {
    setIsCreating(true);
    setEditing(null);
    formModal.open();
  }

  function openEdit(facility: FacilityResponse) {
    setIsCreating(false);
    setEditing(facility);
    formModal.open();
  }

  function handleSubmit(values: FacilityFormValues) {
    const mutation = isCreating ? createFacility : updateFacility;
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success(isCreating ? 'Facility created' : 'Facility updated');
        formModal.close();
      },
      onError: (err) => showActionError(err, 'Something went wrong'),
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteFacility.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Facility deleted');
        deleteDialog.close();
      },
      onError: (err) => showActionError(err, 'Something went wrong'),
    });
  }

  const columns: DataTableColumn<FacilityResponse>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (f) => <span className="font-medium">{f.name}</span> },
    { key: 'facilityType', header: 'Type', sortable: true, render: (f) => FACILITY_TYPE_LABELS[f.facilityType] },
    { key: 'city', header: 'Location', sortable: true, render: (f) => `${f.city}, ${f.state}` },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (f) => (
        <Chip size="sm" color={f.active ? 'success' : 'default'}>
          {f.active ? 'Active' : 'Inactive'}
        </Chip>
      ),
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: '',
            render: (f: FacilityResponse) => (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onPress={() => openEdit(f)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setDeleteTarget(f);
                    deleteDialog.open();
                  }}
                >
                  Delete
                </Button>
              </div>
            ),
          } satisfies DataTableColumn<FacilityResponse>,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facilities</h1>
          <p className="text-sm text-muted">Manufacturing facilities tracked by gizmoshop.</p>
        </div>
        <div className="flex gap-2">
          {canManageData && (
            <BulkActions
              onExport={exportFacilitiesCsv}
              onImport={importFacilitiesCsv}
              onImported={() => refetch()}
              exportFilename="facilities.csv"
            />
          )}
          {canEdit && <Button onPress={openCreate}>New Facility</Button>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or city…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          className="max-w-sm"
        />
        <FilterSelect
          value={type}
          onChange={(v) => {
            setType(v);
            setPage(0);
          }}
          options={typeFilterOptions}
          placeholder="Type"
          allLabel="All types"
          className="w-44"
        />
        <FilterSelect
          value={active}
          onChange={(v) => {
            setActive(v);
            setPage(0);
          }}
          options={activeFilterOptions}
          placeholder="Status"
          allLabel="All statuses"
          className="w-40"
        />
      </div>

      <DataTable
        aria-label="Facilities"
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
        emptyMessage="No facilities found."
      />

      <Modal.Backdrop isOpen={formModal.isOpen} onOpenChange={formModal.setOpen}>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{isCreating ? 'New Facility' : 'Edit Facility'}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <FacilityForm
                key={editing?.id ?? 'new'}
                defaultValues={editing ?? undefined}
                onSubmit={handleSubmit}
                onCancel={formModal.close}
                isSubmitting={createFacility.isPending || updateFacility.isPending}
                serverError={createFacility.error ?? updateFacility.error}
              />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <ConfirmDeleteDialog
        isOpen={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete facility?"
        description={`This will permanently delete "${deleteTarget?.name}" and all of its permits and inspections.`}
        onConfirm={handleDelete}
        isPending={deleteFacility.isPending}
      />
    </div>
  );
}

import { Fragment, type ReactNode } from 'react';
import { Pagination, Spinner, Table } from '@heroui/react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Enables click-to-sort on this column's header. `key` must match a property the backend accepts in `?sort=`. */
  sortable?: boolean;
  /**
   * Marks this as the column whose cell identifies each row for assistive tech
   * (react-aria requires exactly one such column, or it throws). Independent of
   * `sortable` - a column can be both. If no column sets this, the DataTable
   * uses the first non-"actions" column automatically, so most pages never
   * need to set it.
   */
  isRowHeader?: boolean;
}

export type SortDirection = 'asc' | 'desc';

interface DataTableProps<T extends { id: number | string }> {
  columns: DataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Column key currently sorted, if any. */
  sortBy?: string;
  sortDir?: SortDirection;
  /** Called with the clicked column's key; the page decides how to toggle direction. */
  onSortChange?: (key: string) => void;
  'aria-label': string;
}

/** The trailing buttons column identifies no data - it's a row of actions, not a field. */
const ACTIONS_KEY = 'actions';

export function DataTable<T extends { id: number | string }>({
  columns,
  rows,
  isLoading,
  emptyMessage = 'No results found.',
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  sortBy,
  sortDir,
  onSortChange,
  'aria-label': ariaLabel,
}: DataTableProps<T>) {
  const rangeStart = totalElements === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min(totalElements, (page + 1) * pageSize);

  // react-aria requires exactly one row-header column. Honor an explicit
  // isRowHeader; otherwise fall back to the first real data column (never the
  // trailing "actions" column, which identifies nothing).
  const rowHeaderKey =
    columns.find((c) => c.isRowHeader)?.key ??
    columns.find((c) => c.key !== ACTIONS_KEY)?.key ??
    columns[0]?.key;

  // Card-view decomposition (mobile): the row-header column becomes the card
  // title, the actions column its footer, everything else a labeled field.
  const titleColumn = columns.find((c) => c.key === rowHeaderKey);
  const actionsColumn = columns.find((c) => c.key === ACTIONS_KEY);
  const fieldColumns = columns.filter((c) => c.key !== rowHeaderKey && c.key !== ACTIONS_KEY);
  const sortableColumns = columns.filter((c) => c.sortable);

  // Pagination is shared below both layouts; render it twice (one instance per
  // layout) rather than lifting it out, so each stays self-contained.
  const pagination = (
    <Pagination>
      <Pagination.Summary>
        {totalElements === 0 ? emptyMessage : `Showing ${rangeStart}-${rangeEnd} of ${totalElements}`}
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous isDisabled={page <= 0} onPress={() => onPageChange(page - 1)}>
            <Pagination.PreviousIcon />
            <span>Previous</span>
          </Pagination.Previous>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Next isDisabled={page + 1 >= totalPages} onPress={() => onPageChange(page + 1)}>
            <span>Next</span>
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );

  return (
    <>
      {/* Desktop: the full sortable table. Hidden on phones, where a 5-6 column
          table forces horizontal scroll and pushes the actions column - Edit /
          Delete - off-screen, making rows look uneditable. */}
      <div className="hidden md:block">
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label={ariaLabel}>
              <Table.Header columns={columns}>
                {(column) => (
                  <Table.Column key={column.key} allowsSorting={column.sortable} isRowHeader={column.key === rowHeaderKey}>
                    {column.sortable ? (
                      <Table.SortableColumnHeader
                        sortDirection={
                          sortBy === column.key ? (sortDir === 'desc' ? 'descending' : 'ascending') : undefined
                        }
                        onClick={() => onSortChange?.(column.key)}
                      >
                        {column.header}
                      </Table.SortableColumnHeader>
                    ) : (
                      column.header
                    )}
                  </Table.Column>
                )}
              </Table.Header>
              <Table.Body
                items={rows}
                renderEmptyState={() =>
                  isLoading ? (
                    <div className="flex justify-center py-10">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="py-10 text-center text-sm text-muted">{emptyMessage}</div>
                  )
                }
              >
                {(row) => (
                  <Table.Row key={row.id} id={row.id}>
                    {columns.map((column) => (
                      <Table.Cell key={column.key}>{column.render(row)}</Table.Cell>
                    ))}
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          <Table.Footer>{pagination}</Table.Footer>
        </Table>
      </div>

      {/* Mobile: one card per row. Every field and both actions stay on-screen
          at phone widths - no horizontal scroll, no hidden Edit button. */}
      <div className="md:hidden">
        {sortableColumns.length > 0 && onSortChange && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">Sort by</span>
            {sortableColumns.map((column) => {
              const active = sortBy === column.key;
              return (
                <button
                  key={column.key}
                  type="button"
                  onClick={() => onSortChange(column.key)}
                  aria-pressed={active}
                  className={`rounded-sm border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? 'border-transparent bg-[var(--accent)] text-[var(--accent-foreground)]'
                      : 'border-default-300 text-foreground/70 hover:bg-default-100'
                  }`}
                >
                  {column.header}
                  {active ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                </button>
              );
            })}
          </div>
        )}

        {rows.length === 0 ? (
          <div className="rounded-sm border border-default-200 py-10 text-center">
            {isLoading ? (
              <div className="flex justify-center">
                <Spinner />
              </div>
            ) : (
              <p className="text-sm text-muted">{emptyMessage}</p>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.id} className="rounded-sm border border-default-200 bg-content1 p-4 shadow-sm">
                {titleColumn && <div className="text-base font-semibold">{titleColumn.render(row)}</div>}
                {fieldColumns.length > 0 && (
                  <dl className="mt-2 grid grid-cols-[minmax(0,auto)_1fr] gap-x-4 gap-y-1.5 text-sm">
                    {fieldColumns.map((column) => (
                      <Fragment key={column.key}>
                        <dt className="text-muted">{column.header}</dt>
                        <dd className="text-right">{column.render(row)}</dd>
                      </Fragment>
                    ))}
                  </dl>
                )}
                {actionsColumn && (
                  <div className="mt-3 border-t border-default-200 pt-3">{actionsColumn.render(row)}</div>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">{pagination}</div>
      </div>
    </>
  );
}

/** Toggles asc -> desc -> (cleared) when re-clicking the same column, or starts a new column at asc. */
export function toggleSort(
  currentKey: string | undefined,
  currentDir: SortDirection | undefined,
  clickedKey: string,
): { sortBy: string | undefined; sortDir: SortDirection | undefined } {
  if (currentKey !== clickedKey) {
    return { sortBy: clickedKey, sortDir: 'asc' };
  }
  if (currentDir === 'asc') {
    return { sortBy: clickedKey, sortDir: 'desc' };
  }
  return { sortBy: undefined, sortDir: undefined };
}

import type { ReactNode } from 'react';
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
    columns.find((c) => c.key !== 'actions')?.key ??
    columns[0]?.key;

  return (
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
      <Table.Footer>
        <Pagination>
          <Pagination.Summary>
            {totalElements === 0
              ? emptyMessage
              : `Showing ${rangeStart}-${rangeEnd} of ${totalElements}`}
          </Pagination.Summary>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={page <= 0}
                onPress={() => onPageChange(page - 1)}
              >
                <Pagination.PreviousIcon />
                <span>Previous</span>
              </Pagination.Previous>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Next
                isDisabled={page + 1 >= totalPages}
                onPress={() => onPageChange(page + 1)}
              >
                <span>Next</span>
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      </Table.Footer>
    </Table>
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

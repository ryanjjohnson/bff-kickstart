import { useState } from 'react';
import { toggleSort, type SortDirection } from '../components/DataTable';

/** Single-column sort state shared by every DataTable-backed page, driving Spring's `?sort=field,dir`. */
export function useSort() {
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<SortDirection | undefined>(undefined);

  function onSortChange(key: string) {
    const next = toggleSort(sortBy, sortDir, key);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
  }

  return {
    sortBy,
    sortDir,
    onSortChange,
    sortParam: sortBy ? `${sortBy},${sortDir}` : undefined,
  };
}

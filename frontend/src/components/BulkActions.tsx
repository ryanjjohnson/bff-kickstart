import { useRef, useState } from 'react';
import { Button, useOverlayState } from '@heroui/react';
import { showActionError } from '../lib/api-client';
import type { BulkImportResult } from '../lib/bulkImport';
import { ImportResultDialog } from './ImportResultDialog';

interface BulkActionsProps {
  onExport: () => Promise<Blob>;
  onImport: (file: File) => Promise<BulkImportResult>;
  /** Called after a successful import so the page can refetch its list. */
  onImported: () => void;
  exportFilename: string;
}

/** Data Manager-only bulk CSV export/import controls, shared across the Facilities/Permits/Inspections pages. */
export function BulkActions({ onExport, onImport, onImported, exportFilename }: BulkActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const resultDialog = useOverlayState();

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await onExport();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showActionError(err, 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsImporting(true);
    try {
      const imported = await onImport(file);
      setResult(imported);
      resultDialog.open();
      if (imported.created + imported.updated > 0) {
        onImported();
      }
    } catch (err) {
      showActionError(err, 'Import failed');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onPress={handleExport} isDisabled={isExporting}>
        {isExporting ? 'Exporting…' : 'Export CSV'}
      </Button>
      <Button size="sm" variant="outline" onPress={() => fileInputRef.current?.click()} isDisabled={isImporting}>
        {isImporting ? 'Importing…' : 'Import CSV'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <ImportResultDialog isOpen={resultDialog.isOpen} onOpenChange={resultDialog.setOpen} result={result} />
    </div>
  );
}

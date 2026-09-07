import { Button, Modal } from '@heroui/react';
import type { BulkImportResult } from '../lib/bulkImport';

interface ImportResultDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  result: BulkImportResult | null;
}

export function ImportResultDialog({ isOpen, onOpenChange, result }: ImportResultDialogProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="lg">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Import results</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            {result && (
              <div className="flex flex-col gap-3">
                <p className="text-sm">
                  {result.created} created, {result.updated} updated
                  {result.skipped > 0 ? `, ${result.skipped} skipped` : ''}.
                </p>
                {result.errors.length > 0 && (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                    <ul className="divide-y divide-border text-sm">
                      {result.errors.map((e) => (
                        <li key={e.row} className="px-3 py-2">
                          <span className="font-medium">Row {e.row}:</span> {e.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button onPress={() => onOpenChange(false)}>Close</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

import { AlertDialog, Button } from '@heroui/react';

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function ConfirmDeleteDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  isPending,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Container>
        <AlertDialog.Dialog>
          <AlertDialog.Header>
            <AlertDialog.Icon status="danger" />
            <AlertDialog.Heading>{title}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>{description}</AlertDialog.Body>
          <AlertDialog.Footer>
            <Button variant="ghost" onPress={() => onOpenChange(false)} isDisabled={isPending}>
              Cancel
            </Button>
            <Button variant="danger" onPress={onConfirm} isDisabled={isPending}>
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

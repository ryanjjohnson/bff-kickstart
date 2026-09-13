import { useRef, useState } from 'react';
import { Button, Spinner, toast } from '@heroui/react';
import { showActionError } from '../../../lib/api-client';
import { inspectionAttachmentDownloadUrl, type InspectionAttachment } from '../api/inspectionAttachments';
import {
  useDeleteInspectionAttachment,
  useInspectionAttachments,
  useUploadInspectionAttachment,
} from '../hooks/useInspectionAttachments';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Reject oversize files up front with a clear message, rather than firing a
// doomed upload the backend (or nginx) would 413. Keep in sync with the server
// limit: spring.servlet.multipart.max-file-size in application.properties.
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

interface InspectionAttachmentsProps {
  inspectionId: number;
  canEdit: boolean;
}

/**
 * Attachment list + upload controls for one saved inspection. "Take photo"
 * uses a capture-hinted file input: on phones/tablets it opens the camera
 * directly; on desktop browsers (no camera capture support) it gracefully
 * degrades to the regular file picker filtered to images.
 */
export function InspectionAttachments({ inspectionId, canEdit }: InspectionAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  const { data: attachments, isLoading } = useInspectionAttachments(inspectionId);
  const uploadAttachment = useUploadInspectionAttachment(inspectionId);
  const deleteAttachment = useDeleteInspectionAttachment(inspectionId);

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    const tooLarge = files.filter((file) => file.size > MAX_ATTACHMENT_BYTES);
    tooLarge.forEach((file) =>
      toast.danger(`${file.name} is ${formatSize(file.size)} - the maximum upload size is 20MB.`),
    );
    const allowed = files.filter((file) => file.size <= MAX_ATTACHMENT_BYTES);
    if (allowed.length === 0) return;
    setUploadingCount((n) => n + allowed.length);
    for (const file of allowed) {
      try {
        await uploadAttachment.mutateAsync(file);
        toast.success(`Uploaded ${file.name}`);
      } catch (err) {
        showActionError(err, `Could not upload ${file.name}`);
      } finally {
        setUploadingCount((n) => n - 1);
      }
    }
  }

  function handleDelete(attachment: InspectionAttachment) {
    deleteAttachment.mutate(attachment.id, {
      onSuccess: () => toast.success(`Deleted ${attachment.filename}`),
      onError: (err) => showActionError(err, `Could not delete ${attachment.filename}`),
    });
  }

  return (
    <section className="flex flex-col gap-3 border-t border-default-200 pt-4" aria-label="Attachments">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Attachments</h3>
        {canEdit && (
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                void handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                void handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <Button size="sm" variant="outline" onPress={() => fileInputRef.current?.click()}>
              Add files
            </Button>
            <Button size="sm" variant="outline" onPress={() => photoInputRef.current?.click()}>
              Take photo
            </Button>
          </div>
        )}
      </div>

      {uploadingCount > 0 && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Spinner size="sm" /> Uploading {uploadingCount} file{uploadingCount === 1 ? '' : 's'}…
        </p>
      )}

      {isLoading ? (
        <Spinner size="sm" />
      ) : (attachments ?? []).length === 0 ? (
        <p className="text-sm text-muted">No attachments yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {(attachments ?? []).map((attachment) => (
            <li
              key={attachment.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-default-100 px-3 py-2"
            >
              <div className="min-w-0">
                <a
                  href={inspectionAttachmentDownloadUrl(inspectionId, attachment.id)}
                  className="block max-w-full truncate text-sm font-medium text-accent hover:underline"
                  download={attachment.filename}
                >
                  {attachment.filename}
                </a>
                <p className="text-xs text-muted">
                  {formatSize(attachment.sizeBytes)}
                  {attachment.uploadedBy && <> · {attachment.uploadedBy}</>}
                  {' · '}
                  {new Date(attachment.uploadedAt).toLocaleString()}
                </p>
              </div>
              {canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => handleDelete(attachment)}
                  isDisabled={deleteAttachment.isPending}
                >
                  Delete
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

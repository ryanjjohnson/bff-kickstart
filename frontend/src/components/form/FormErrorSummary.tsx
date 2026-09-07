import { Alert } from '@heroui/react';
import { ApiError } from '../../lib/api-client';

interface FormErrorSummaryProps {
  error: unknown;
}

/**
 * Renders nothing unless the last submit failed. Field-level messages also
 * show inline via useApplyServerErrors + FieldError; this summary exists so
 * messages that don't map to a rendered field (cross-field checks like
 * Permit's "expiration after issued", or a plain ConflictException with no
 * fieldErrors at all) are never silently dropped.
 */
export function FormErrorSummary({ error }: FormErrorSummaryProps) {
  if (!(error instanceof ApiError)) {
    return null;
  }

  const messages = error.fieldErrors && Object.keys(error.fieldErrors).length > 0
    ? Object.values(error.fieldErrors)
    : [error.message];

  return (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{messages.length > 1 ? 'Please fix the following' : 'Unable to save'}</Alert.Title>
        <Alert.Description>
          {messages.length > 1 ? (
            <ul className="list-inside list-disc">
              {messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : (
            messages[0]
          )}
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}

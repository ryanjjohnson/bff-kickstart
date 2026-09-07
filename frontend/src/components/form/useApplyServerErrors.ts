import { useEffect } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '../../lib/api-client';

/**
 * Maps a failed mutation's server-side field errors (400 response's
 * `fieldErrors`, see GlobalExceptionHandler on the backend) onto the
 * matching react-hook-form fields, so they render through the same
 * `FieldError` UI as client-side zod validation. Field names line up because
 * the DTO/Bean Validation property names were deliberately kept identical to
 * the zod schema's - see each feature's types/*.ts.
 *
 * A couple of cross-field checks (e.g. Permit's "expiration after issued")
 * surface under a synthetic property name that doesn't match any rendered
 * input; those still show up via FormErrorSummary below rather than being
 * silently dropped.
 */
export function useApplyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: unknown,
) {
  useEffect(() => {
    if (error instanceof ApiError && error.fieldErrors) {
      for (const [field, message] of Object.entries(error.fieldErrors)) {
        setError(field as Path<T>, { type: 'server', message });
      }
    }
  }, [error, setError]);
}

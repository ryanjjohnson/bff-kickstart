import { AlertDialog, Button } from '@heroui/react';
import { useAuth } from './AuthContext';
import { useIdleTimeout } from './useIdleTimeout';

const TIMEOUT_MS = 5 * 60 * 1000;
// Warning starts 1 minute before the 5-minute mark, i.e. at 4 minutes idle.
const WARNING_LEAD_MS = 60 * 1000;

/**
 * Renders nothing until the user has been inactive for 4 minutes, then shows a
 * non-dismissable countdown. Logs the user out for real (RP-initiated, via
 * AuthContext#logout) if the countdown reaches zero. Mount once, near the app
 * root, only while authenticated.
 */
export function SessionTimeoutMonitor() {
  const { isAuthenticated, logout, refreshSession } = useAuth();

  const { secondsRemaining, extend } = useIdleTimeout({
    timeoutMs: TIMEOUT_MS,
    warningMs: WARNING_LEAD_MS,
    enabled: isAuthenticated,
    onTimeout: logout,
  });

  const isWarning = secondsRemaining != null;

  function handleStillHere() {
    extend();
    refreshSession();
  }

  return (
    <AlertDialog.Backdrop isOpen={isWarning} onOpenChange={() => {}}>
      <AlertDialog.Container>
        <AlertDialog.Dialog aria-label="Session timeout warning">
          <AlertDialog.Header>
            <AlertDialog.Icon status="warning" />
            <AlertDialog.Heading>Your session is about to expire</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            You've been inactive for a while. For your security, you'll be signed out in{' '}
            <span className="font-mono font-semibold tabular-nums">{secondsRemaining ?? 0}</span>{' '}
            second{secondsRemaining === 1 ? '' : 's'}.
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button onPress={handleStillHere}>I'm still here</Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

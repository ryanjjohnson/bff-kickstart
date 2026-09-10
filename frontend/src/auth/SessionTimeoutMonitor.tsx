import { AlertDialog, Button } from '@heroui/react';
import { IDLE_TIMEOUT_SECONDS, IDLE_WARNING_SECONDS } from '../lib/config';
import { useAuth } from './AuthContext';
import { useIdleTimeout } from './useIdleTimeout';

// Both env-configurable - see lib/config.ts. With the defaults (300/60), the
// warning starts 1 minute before the 5-minute mark, i.e. at 4 minutes idle.
const TIMEOUT_MS = IDLE_TIMEOUT_SECONDS * 1000;
const WARNING_LEAD_MS = IDLE_WARNING_SECONDS * 1000;

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
    // z-[100001]: the TanStack Query devtools panel renders at z-index 100000,
    // above this backdrop's default layer. Since this dialog is deliberately
    // non-dismissable and blocks interaction with everything outside itself,
    // letting the devtools paint on top produced a deadlock: the panel covered
    // the "I'm still here" button while the dialog blocked the panel's own
    // close button. The warning dialog must win the stacking contest outright.
    <AlertDialog.Backdrop isOpen={isWarning} onOpenChange={() => {}} className="z-[100001]">
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

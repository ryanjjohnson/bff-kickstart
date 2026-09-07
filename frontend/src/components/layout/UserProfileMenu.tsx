import { Button, Chip, Popover } from '@heroui/react';
import { useAuth } from '../../auth/AuthContext';

/**
 * Roles used to be listed side-by-side as chips right in the header - some real
 * deployments assign 20+ roles to a user, which doesn't fit next to a username.
 * Instead the name is a trigger for a popover with the full profile, roles
 * included in their own scrollable section so an arbitrarily long list never
 * blows up the header or the popover itself.
 */
export function UserProfileMenu() {
  const { fullName, firstName, lastName, email, username, roles } = useAuth();

  return (
    <Popover.Root>
      <Button variant="ghost" size="sm" className="font-medium text-white hover:bg-white/10">
        {fullName}
      </Button>
      <Popover.Content placement="bottom end">
        <Popover.Dialog className="w-72 p-4">
          <div className="flex flex-col gap-3 text-sm">
            <Field label="First name" value={firstName} />
            <Field label="Last name" value={lastName} />
            <Field label="Email" value={email} />
            <Field label="Username" value={username} />
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
                Roles ({roles.length})
              </div>
              <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto">
                {roles.map((role) => (
                  <Chip key={role} size="sm" variant="soft" color="accent">
                    {role}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div>{value}</div>
    </div>
  );
}

# Adding a secure feature

*For developers building a new resource on top of BFF Kickstart. Assumes you're comfortable with
Spring Boot and React, but new to how this app's auth setup interacts with them. If you just need
the UI/API scaffolding steps (not the security side), `frontend/README.md`'s "Adding a new page
with a CRUD form" already covers that in full - this doc is the security checklist that wraps
around it.*

## The one thing to internalize first

**The backend is the only trust boundary. The frontend is a convenience.** Everywhere below where
you see a frontend `hasRole()` check next to a backend `@PreAuthorize`, the frontend one exists so
the UI doesn't show a button that would just 403 - it is never, by itself, what makes the feature
secure. If you only add the frontend check, the feature is *not* secured; someone with `curl` and
a valid session cookie (or a Bearer token, if `API_EXPOSED=true`) can still call the endpoint
directly. This isn't a hypothetical - it's exactly what a code reviewer or a pentest will check
first.

## Worked example: adding a "Vehicles" resource

Say you're asked to add fleet vehicle tracking - a new CRUD resource, viewable by everyone who can
already view facilities, but only editable by `Admin` and a new `Fleet Manager` role that doesn't
exist yet.

### Step 1 - decide the access rule before writing any code

Write it down in plain language first, the way you'd say it out loud:

> "Anyone who can view facilities can view vehicles. Only admins and fleet managers can create,
> edit, or delete a vehicle."

This sentence is what your `@PreAuthorize` annotations and your role decisions both need to match
exactly - if it doesn't fit cleanly into "read: roles X/Y/Z, write: roles A/B", that's worth
noticing now, not after you've half-implemented two different rules.

### Step 2 - does this need a new role?

Check the existing four first (`Admin`, `Inspector`, `Viewer`, `Data Manager` - see the root
README's [Roles](../README.md#roles) section) - reusing one is simpler to reason about than
adding a new one, and every new role is one more thing a future developer has to remember exists.
Here, `Fleet Manager` is genuinely new, so it needs to exist in two places, for two different
reasons:

1. **The identity side - gizmoshop SSO.** This app doesn't run its own identity service (see the
   root README's [Identity provider: gizmoshop SSO](../README.md#identity-provider-gizmoshop-sso))
   - `Fleet Manager` has to actually exist as a **client role** on this app's client in gizmoshop
   SSO's shared realm before anyone can be granted it. Two different situations:
   - **Just building/testing locally** against this repo's local gizmoshop SSO stand-in: add the
     role yourself to `keycloak/realm-export/gizmoshop-realm.json`, assign it to whichever demo
     user(s) should have it so you can test as that role, then reimport - see
     `docs/03-full-reference.md`'s "Changing the realm export after first boot" for applying a
     change without nuking your local demo data.
   - **Shipping this for real**, against the real gizmoshop SSO: you can't self-service this.
     Request the new client role (and, separately, that it be granted to the right real users)
     from your identity/platform team the same way this app's own client was set up there in the
     first place. Nothing in this repo can create or grant a role in that realm.
2. **The app side.** Once the role exists and is coming through in the token, everything from Step
   3 onward is identical no matter which gizmoshop SSO instance issued it - `@PreAuthorize`,
   `KeycloakRealmRoleConverter`, and the frontend's `hasRole()` all just read the claim, with no
   awareness of where it was provisioned.

**Why a client role, not a realm role:** this app's whole role-mapping pipeline
(`KeycloakRealmRoleConverter`) reads roles from the `resource_access.bff-kickstart-client.roles`
token claim, which is where *client* roles land - not `realm_access.roles`, where realm roles
land. A realm role you add here will exist in Keycloak, look correct in the admin console, and
then silently never show up as a `ROLE_*` authority anywhere in this app. If a role you just added
isn't working, this is the first thing to check.

### Step 3 - backend: entity, controller, `@PreAuthorize`

Follow the existing `Facility`/`Permit`/`Inspection` pattern for the entity, repository, service,
and DTOs - nothing about that changes for a secured resource. The security-specific part is the
controller's annotations, and the existing `FacilityController` is the exact template to copy:

```java
@RestController
@RequestMapping("/api/v1/vehicles")
@PreAuthorize("hasAnyRole('Admin','Inspector','Viewer','Fleet Manager')")   // class-level: covers every method's floor
public class VehicleController {

    @GetMapping
    public PageResponse<VehicleResponse> search(...) { ... }        // inherits the class-level rule - any of the four roles can read

    @GetMapping("/{id}")
    public VehicleResponse getById(@PathVariable Long id) { ... }   // same

    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Fleet Manager')")            // method-level narrows it further for writes
    public ResponseEntity<VehicleResponse> create(@Valid @RequestBody VehicleRequest request) { ... }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Fleet Manager')")
    public VehicleResponse update(@PathVariable Long id, @Valid @RequestBody VehicleRequest request) { ... }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Fleet Manager')")
    public void delete(@PathVariable Long id) { ... }
}
```

A class-level `@PreAuthorize` sets the *floor* for every method in the controller; a method-level
one narrows it further for that one method - it can't widen it back past what the class-level
check already refused. This is why `search`/`getById` above need no annotation of their own: they
inherit the class-level "any of these four roles" rule as-is, exactly like every other read
endpoint in this app.

Nothing else about this needs to change. You did not touch `SecurityConfig`, you did not add a new
filter, you did not think about sessions, cookies, JWTs, or CSRF tokens - all of that is shared
infrastructure this feature gets for free, the same as every existing one. That's the actual
point of the BFF architecture from a developer's chair: securing a new feature is an annotation,
not a subsystem.

### Step 4 - frontend: scaffold, then gate the UI (not the security)

```bash
cd frontend && npm run generate
```

matching `frontend/README.md`'s existing walkthrough. The one addition specific to a
partially-restricted feature: gate the Create/Edit/Delete buttons on the new role, same as every
existing form does for `Admin`:

```tsx
const { hasRole } = useAuth();

{hasRole('Admin', 'Fleet Manager') && (
  <Button onPress={openCreateModal}>Add vehicle</Button>
)}
```

`useAuth().hasRole(...)` reads the roles `/api/v1/me` returned at login - see
`frontend/README.md`'s [Security](../frontend/README.md#security) section for how that's wired up.
Get the role list wrong here and the worst that happens is a `Viewer` sees a button that 403s when
clicked (annoying, not a vulnerability) or a `Fleet Manager` doesn't see a button they're actually
allowed to use (a bug report, not a vulnerability) - because Step 3 is the actual gate. That
asymmetry is deliberate and is the whole reason to always do Step 3 first, by hand, and never
treat Step 4 as a substitute for it even under deadline pressure.

### Step 5 - test as more than one role

Before calling this done, sign in as at least: a role that should have full access
(`Admin`), the new role if you added one (`Fleet Manager` demo user, once you've assigned the
role in Step 2), and a role that should be read-only or blocked entirely (`Viewer`, or `Inspector`
if vehicles are meant to be Admin/Fleet-Manager-only). Confirm the blocked case actually 403s from
the backend directly, not just that the frontend hides the button - the root README's
["Try it: calling the API as a machine client"](../README.md#try-it-calling-the-api-as-a-machine-client)
section has a ready-made `curl` recipe for exactly this, or just open your browser's network tab
and manually re-fire the request as the wrong role.

## Checklist

- [ ] Access rule written in plain language before any code
- [ ] Reused an existing role, or added a new **client** role (not realm role) if genuinely needed
- [ ] `@PreAuthorize` on the controller (class-level floor + method-level narrowing for writes) -
      matches the plain-language rule from step 1 exactly
- [ ] Frontend `hasRole()` gates the UI for convenience only - not relied on as the actual control
- [ ] Tested signed in as an allowed role, a blocked role, and (if applicable) the new role,
      confirming the backend itself rejects the blocked case - not just that a button is hidden

## Where to go next

Wondering *why* client roles land in `resource_access` while realm roles don't, or how this
extends to a machine-to-machine API client instead of a browser user? See
[03 - Full reference](03-full-reference.md).

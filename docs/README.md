# BFF Kickstart docs - choose your depth

This app's authentication is a backend-for-frontend (BFF) OIDC setup, and it comes up in
conversation with different kinds of developers - one building a feature on top of it, one
changing how it works. One README trying to serve both ends up either too shallow for the second
group or too dense for the first. So instead, two documents, each a superset of the reader's
actual need:

| Doc | Audience | What it answers |
|---|---|---|
| [Architecture overview deck](BFF-Architecture-Overview.pptx) | Developers & technical leads, presentation form | Fifteen slides on how the BFF pattern works here - login flow, CSRF, roles, revocation, topology, trade-offs - with speaker notes |
| [Developer walkthrough deck](BFF-Developer-Walkthrough.pptx) | Developers, presentation form | Nine slides of wiring: which class does what, one request traced end to end, CSRF/session/proxy mechanics, where to plug in - with speaker notes |
| [02 - Adding a secure feature](02-adding-a-secure-feature.md) | Mid-level Java/React developers building on top of this app | The checklist for adding a new resource end-to-end without leaving a hole in it |
| [03 - Full reference](03-full-reference.md) | Senior developers, whoever owns this app's security posture long-term | Threat model, production hardening, extending the auth setup, a real incident this app already had |

Each doc stands alone - a senior developer landing directly on 03 isn't missing prerequisites.
They get progressively more detailed, not more correct; nothing in 02 is a simplification that 03
contradicts.

Two in-depth guides remain the authoritative, line-level source of truth for
everything else about this app (running it, project structure, validation, roles, adding a
feature's UI/API plumbing) - see [`full-guide.md`](full-guide.md) and
[`frontend-guide.md`](frontend-guide.md). These docs are a lens on the *authentication*
slice of that material, organized by audience instead of by file.

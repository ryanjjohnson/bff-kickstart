# Public deployment: any Docker host + Cloudflare Tunnel

Free public hosting for the whole stack on hardware you already own (an Unraid box, a
home server, a VPS): Cloudflare's edge terminates TLS and tunnels straight into the
compose network - no ports forwarded, no reverse proxy to run, no certificates to manage.

## Prerequisites

- A domain on Cloudflare (registered there, or nameservers moved - free plan is fine).
- A scoped API token: **Account > Cloudflare Tunnel > Edit** and **Zone > DNS > Edit**
  (dash.cloudflare.com > My Profile > API Tokens).
- Docker with the compose plugin on the host, plus `curl`, `python3`, `openssl`.
  No JDK/Maven/Node needed - everything builds in containers.

## Deploy

From the repo root on the host:

```bash
CF_API_TOKEN=your-token ZONE_NAME=example.com \
APP_HOSTNAME=kickstart.example.com SSO_HOSTNAME=kickstart-sso.example.com \
./deploy/deploy.sh
```

That provisions the tunnel + DNS (idempotently), generates `deploy/.env.deploy` with
rotated secrets (OAuth2 client secret, Keycloak admin password - preserved on re-runs),
patches a deploy copy of the realm export (public redirect URIs, container-to-container
backchannel logout), builds the SPI jar in dockerized Maven, and brings everything up
with the overlay. Re-run it any time; it converges.

## What's public and what isn't

| Surface | Exposure |
|---|---|
| `https://APP_HOSTNAME/bff-kickstart/` | Public - the app |
| `https://SSO_HOSTNAME` | Public - Keycloak login/registration/account (but NOT `/admin`) |
| `https://SSO_HOSTNAME/admin*` | **404 from the internet** - the tunnel doesn't route it (provision-tunnel.sh) |
| Keycloak admin console | LAN/host-only via a published port - see below |
| Backend, Postgres, Mailhog | Not exposed - compose network only |

### Reaching the Keycloak admin console

`/admin` is deliberately off the public tunnel, so the admin console is reached through a
host port instead, published by the deploy overlay. Two env vars in `deploy/.env.deploy`
control it:

- `KC_ADMIN_BIND` - host interface to bind. Default `127.0.0.1` (box-only; reach it with an
  SSH tunnel: `ssh -L 18080:127.0.0.1:18080 root@HOST` then open `http://localhost:18080/admin/`).
  Set it to the host's **LAN IP** to reach the console from other machines on the LAN.
- `KC_ADMIN_PORT` - host port (default `18080`).
- `KC_ADMIN_URL` - the admin console's own base URL, e.g. `http://192.168.1.191:18080`. Set
  this to match, or the console redirects to the public `KC_HOSTNAME` (whose `/admin` 404s).
  It sets Keycloak's `KC_HOSTNAME_ADMIN`, so the admin console authenticates against the
  public auth server but stays on the LAN URL. Reach it by that exact host, not an alias.

Never set `KC_ADMIN_BIND` to `0.0.0.0` on a host that is port-forwarded from the internet -
that re-exposes `/admin` publicly, defeating the tunnel block.

The demo app users (`admin`/`inspector`/`viewer`/`manager`, password `password`) ship
as-is: that's the point of a public demo, and they can't reach anything but demo data
in an in-memory database that resets on every backend restart. Rotate or delete them
before putting anything real behind this.

## Day-2 notes

- **Update the app**: `git pull` then re-run `deploy/deploy.sh` (rebuilds changed images).
- **Logs**: `docker compose -f docker-compose.yml -f deploy/docker-compose.deploy.yml logs -f cloudflared`
  shows tunnel health; the tunnel also appears in Zero Trust > Networks > Tunnels.
- **Tear down**: `docker compose ... down`; the tunnel and DNS records linger harmlessly
  (delete them in the dashboard if you want them gone).
- **How the auth wiring differs from local**: browser-facing Keycloak URLs use the public
  hostname (and tokens carry it as issuer); the backend still calls `keycloak:8080`
  inside the compose network (`KC_HOSTNAME_BACKCHANNEL_DYNAMIC`). Cookies are Secure,
  and the forwarded `X-Forwarded-Proto` from the tunnel makes Spring and Keycloak
  generate correct `https://` URLs.

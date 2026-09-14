FROM node:20-alpine AS build
# Baked into the built JS/HTML at compile time (Vite's `base` and the client
# bundle's import.meta.env), so - unlike the backend's context-path - changing
# these requires a rebuild, not just a container restart with a different env
# var.
ARG VITE_FRONTEND_BASE_PATH=/bff-kickstart
# Deliberately not VITE_-prefixed - see frontend/.env's comment on the same
# variable. Only vite.config.ts reads this at build time; the client bundle
# never needs it.
ARG BACKEND_BASE_PATH=/bff-kickstart-api
# Session timing (seconds) - same compile-time caveat as the base paths above.
# Defaults mirror src/lib/config.ts; see the root .env.example.
ARG VITE_IDLE_TIMEOUT_SECONDS=300
ARG VITE_IDLE_WARNING_SECONDS=60
ARG VITE_AUTH_RECHECK_SECONDS=30
ENV VITE_FRONTEND_BASE_PATH=$VITE_FRONTEND_BASE_PATH
ENV BACKEND_BASE_PATH=$BACKEND_BASE_PATH
ENV VITE_IDLE_TIMEOUT_SECONDS=$VITE_IDLE_TIMEOUT_SECONDS
ENV VITE_IDLE_WARNING_SECONDS=$VITE_IDLE_WARNING_SECONDS
ENV VITE_AUTH_RECHECK_SECONDS=$VITE_AUTH_RECHECK_SECONDS
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Assemble a shell-less nginx ---
# The final image has no shell, so the stock nginx entrypoint's runtime
# envsubst can't run. But every value it substitutes is a build-time known
# (the base paths mirror the Vite build args; the backend port is fixed), so
# render the config HERE, validate it, then stage nginx plus exactly the shared
# libraries it links (resolved with ldd) for copy into a distroless base.
# bookworm (glibc), not alpine (musl), to match distroless/base-debian12's ABI.
FROM nginx:1.27-bookworm AS nginxsrc
ARG VITE_FRONTEND_BASE_PATH=/bff-kickstart
ARG BACKEND_BASE_PATH=/bff-kickstart-api
ARG BACKEND_PORT=8081
# The template names the vars FRONTEND_BASE_PATH/BACKEND_BASE_PATH/BACKEND_PORT;
# map the build args onto those names for envsubst.
ENV FRONTEND_BASE_PATH=$VITE_FRONTEND_BASE_PATH
ENV BACKEND_BASE_PATH=$BACKEND_BASE_PATH
ENV BACKEND_PORT=$BACKEND_PORT
COPY nginx.conf.template /tmp/default.conf.template
RUN set -eux; \
    # Substitute ONLY our three vars, never nginx's own $uri/$http_host/etc -
    # the same allowlisting the stock 20-envsubst-on-templates.sh does.
    envsubst '${FRONTEND_BASE_PATH} ${BACKEND_BASE_PATH} ${BACKEND_PORT}' \
      < /tmp/default.conf.template > /etc/nginx/conf.d/default.conf; \
    # (No `nginx -t` here: it resolves the `backend` upstream, which doesn't
    # exist at build time - only on the compose network at run time.)
    # Stage nginx, its dynamic-library closure (absolute paths preserved), the
    # config, the docroot/cache/log skeleton, passwd/group (for the `nginx`
    # worker user the config drops to), and empty writable run dirs for the pid.
    mkdir -p /stage/run /stage/var/run; \
    cp -a --parents /usr/sbin/nginx /stage; \
    # -L (dereference): ldd reports each lib by its SONAME, which is often a
    # symlink (libcrypt.so.1 -> libcrypt.so.1.1.0). Copying the symlink alone
    # would dangle; -L writes a real file at the SONAME path the linker looks up.
    ldd /usr/sbin/nginx | awk '/=> \//{print $3}' | sort -u \
      | while read -r lib; do cp -L --parents "$lib" /stage; done; \
    cp -a --parents /etc/nginx /stage; \
    cp -a --parents /var/cache/nginx /stage; \
    cp -a --parents /var/log/nginx /stage; \
    cp -a --parents /etc/passwd /etc/group /stage

FROM gcr.io/distroless/base-debian12
ARG VITE_FRONTEND_BASE_PATH=/bff-kickstart
# nginx binary + libs + config + skeleton, all at their real absolute paths.
COPY --from=nginxsrc /stage/ /
# The built SPA, served from its own base path (matches the location block).
COPY --from=build /build/dist /usr/share/nginx/html${VITE_FRONTEND_BASE_PATH}
EXPOSE 80
# Master runs as root (to bind :80); workers drop to `nginx` per nginx.conf.
# Full path + exec form: no shell, no entrypoint script.
ENTRYPOINT ["/usr/sbin/nginx", "-g", "daemon off;"]

FROM node:20-alpine AS build
# Baked into the built JS/HTML at compile time (Vite's `base` and the client
# bundle's import.meta.env), so - unlike the backend's context-path, or
# nginx's own proxy config below - changing these requires a rebuild, not
# just a container restart with a different env var.
ARG VITE_FRONTEND_BASE_PATH=/bff-kickstart
# Deliberately not VITE_-prefixed - see frontend/.env's comment on the same
# variable. Only vite.config.ts reads this at build time; the client bundle
# never needs it.
ARG BACKEND_BASE_PATH=/bff-kickstart-api
ENV VITE_FRONTEND_BASE_PATH=$VITE_FRONTEND_BASE_PATH
ENV BACKEND_BASE_PATH=$BACKEND_BASE_PATH
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ARG VITE_FRONTEND_BASE_PATH=/bff-kickstart
# The SPA's own base path must match where it's physically served from - see
# nginx.conf.template's matching location block (rendered from the
# FRONTEND_BASE_PATH env var at container start; keep both in sync).
COPY --from=build /build/dist /usr/share/nginx/html${VITE_FRONTEND_BASE_PATH}
# Rendered to /etc/nginx/conf.d/default.conf at container start via envsubst,
# substituting ${FRONTEND_BASE_PATH}/${BACKEND_BASE_PATH}/${BACKEND_PORT} from
# the container's actual environment - see docker-compose.yml. This is the
# official nginx image's own templating mechanism (see
# docker-entrypoint.d/20-envsubst-on-templates.sh in the base image), not a
# custom script.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80

# ---------- Stage 1: build the frontend ----------
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Copy the lock file too, so every build installs the same package versions
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# ---------- Stage 2: serve with Alpine's own patched nginx, without root ----------
FROM alpine:3.23


RUN apk update \
    && apk upgrade --no-cache \
        && apk add --no-cache 'nginx=1.28.3-r7' gettext-envsubst \
    && rm -f /etc/nginx/http.d/default.conf \
    && apk info -v nginx

COPY nginx-main.conf /etc/nginx/nginx.conf
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
COPY sbt-logo.png /usr/share/nginx/html/sbt-logo.png

# Run as a non-root user
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /tmp/default.conf && exec nginx -e /dev/stderr -g 'daemon off;'"]

#!/bin/sh
set -eu

: "${SKILLHUB_WEB_API_BASE_URL:=}"
: "${SKILLHUB_PUBLIC_BASE_URL:=}"

# Generate runtime-config.js
cat /usr/share/nginx/html/runtime-config.js.template | envsubst '${SKILLHUB_WEB_API_BASE_URL} ${SKILLHUB_PUBLIC_BASE_URL}' > /tmp/runtime-config.js || true
cp /tmp/runtime-config.js /usr/share/nginx/html/runtime-config.js 2>/dev/null || true

# Generate registry/skill.md with actual public URL
cat /usr/share/nginx/html/registry/skill.md.template | envsubst '${SKILLHUB_PUBLIC_BASE_URL}' > /tmp/skill.md || true
cp /tmp/skill.md /usr/share/nginx/html/registry/skill.md 2>/dev/null || true

#!/bin/sh
# Replace environment variables in nginx config and start nginx
BACKEND_URL=${BACKEND_URL:-http://localhost:8000}
export BACKEND_URL

envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
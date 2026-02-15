#!/bin/sh
set -e

# Replace ${API_HOST} in default.conf.template and output to default.conf
envsubst '${API_HOST}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Execute the CMD from the Dockerfile (which is "nginx -g 'daemon off;'")
exec "$@"

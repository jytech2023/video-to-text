#!/bin/sh

# If YT_COOKIES_BASE64 env var is set, decode it to a cookies file
# This allows passing YouTube cookies via Render environment variables
if [ -n "$YT_COOKIES_BASE64" ]; then
  echo "$YT_COOKIES_BASE64" | base64 -d > /tmp/cookies.txt
  export YT_COOKIE_FILE=/tmp/cookies.txt
  echo "YouTube cookies file created from YT_COOKIES_BASE64"
fi

exec "$@"

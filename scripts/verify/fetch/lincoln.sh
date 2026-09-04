#!/usr/bin/env bash
# Snapshot a City of Lincoln page.
#
# www.lincoln.ne.gov sits behind Akamai, which refuses a bare curl with a
# 403 "Access Denied" page 488 bytes long. It serves the real document to a
# request carrying a full browser header set. Nothing here impersonates a
# person or evades a login — it is a public page that requires the headers
# a browser actually sends. Kept as a script so the next re-check fetches
# the same way rather than rediscovering this.
set -euo pipefail

url="$1"
out="$2"

curl -sS --compressed --fail \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.9' \
  -H 'sec-ch-ua: "Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'Sec-Fetch-Dest: document' \
  -H 'Sec-Fetch-Mode: navigate' \
  -H 'Sec-Fetch-Site: none' \
  -H 'Sec-Fetch-User: ?1' \
  -H 'Upgrade-Insecure-Requests: 1' \
  "$url" -o "$out"

bytes=$(wc -c < "$out")
if [ "$bytes" -lt 5000 ]; then
  echo "REFUSED: $url returned only $bytes bytes — probably the Akamai deny page." >&2
  exit 1
fi
printf '%8s bytes  %s\n' "$bytes" "$out"

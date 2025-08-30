#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-http://localhost:4321}"

checks=0
pass=0

function check() {
  local path=$1
  local expect=$2
  ((checks++))
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path") || code=0
  if [[ "$code" == "$expect" ]]; then
    echo "[OK] $path -> $code"
    ((pass++))
  else
    echo "[FAIL] $path -> $code (expected $expect)" >&2
  fi
}

check '/' 200
check '/projects' 200
check '/api/geo' 200
check '/api/guestbook' 200
check '/api/guestbook/stats' 200
check '/verification' 200
check '/demo' 410

echo "Passed $pass / $checks checks"
[[ $pass -eq $checks ]] || exit 1

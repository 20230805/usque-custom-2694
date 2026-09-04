#!/usr/bin/env sh
set -eu

echo "=========================================="
echo " Usque MASQUE Pro v6.7 - Workers Deploy"
echo "=========================================="

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is required."
  exit 1
fi

npm install
npx wrangler login
npx wrangler deploy

echo
echo "Deployment completed."
echo "Open the *.workers.dev URL printed by Wrangler and test /api/health."

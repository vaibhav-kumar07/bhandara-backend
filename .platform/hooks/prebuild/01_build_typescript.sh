#!/bin/bash

set -e

echo "Building TypeScript project..."

cd /var/app/staging

npm run build

echo "TypeScript build completed"

ls -la dist/

echo "Build output created successfully"


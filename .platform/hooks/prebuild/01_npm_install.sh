#!/bin/bash

set -e

cd /var/app/staging

echo "Installing dependencies..."

npm ci --production

echo "Dependencies installed successfully"


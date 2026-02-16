#!/bin/bash

set -e

echo "Installing all dependencies including devDependencies for build..."

cd /var/app/staging

npm install

echo "Dependencies installed"


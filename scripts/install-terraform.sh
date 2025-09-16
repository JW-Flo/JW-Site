#!/usr/bin/env bash
set -euo pipefail

VERSION="1.9.5"
OS="$(uname | tr '[:upper:]' '[:lower:]')"
ARCH="amd64"

if command -v terraform >/dev/null 2>&1; then
  echo "Terraform already installed: $(terraform version | head -n1)"
  exit 0
fi

echo "Downloading Terraform ${VERSION}..." 
URL="https://releases.hashicorp.com/terraform/${VERSION}/terraform_${VERSION}_${OS}_${ARCH}.zip"
TMP_DIR="$(mktemp -d)"
cd "$TMP_DIR"
curl -sSL -o terraform.zip "$URL"
unzip -q terraform.zip
chmod +x terraform

# Prefer local bin
INSTALL_DIR="$HOME/.local/bin"
mkdir -p "$INSTALL_DIR"
mv terraform "$INSTALL_DIR"/

if ! echo "$PATH" | grep -q "$HOME/.local/bin"; then
  echo "Add the following to your shell profile to update PATH:"
  echo 'export PATH="$HOME/.local/bin:$PATH"'
fi

echo "Terraform ${VERSION} installed to $INSTALL_DIR"

#!/bin/bash
# Setup script for MCD app configuration files
# This script copies Config.plist.example files to Config.plist for local development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Setting up configuration files..."

# macOS app config
MACOS_CONFIG_DIR="$ROOT_DIR/apps/macos/MCD-macOS/MCDApp"
MACOS_EXAMPLE="$ROOT_DIR/apps/macos/Config.plist.example"
MACOS_CONFIG="$MACOS_CONFIG_DIR/Config.plist"

if [ -f "$MACOS_CONFIG" ]; then
    echo "  [skip] macOS Config.plist already exists"
else
    if [ -f "$MACOS_EXAMPLE" ]; then
        cp "$MACOS_EXAMPLE" "$MACOS_CONFIG"
        echo "  [created] $MACOS_CONFIG"
        echo "            Please edit and add your MCD_MCP_TOKEN"
    else
        echo "  [error] Example file not found: $MACOS_EXAMPLE"
    fi
fi

# iOS app config
IOS_CONFIG_DIR="$ROOT_DIR/apps/ios/MCD-iOS"
IOS_EXAMPLE="$ROOT_DIR/apps/ios/Config.plist.example"
IOS_CONFIG="$IOS_CONFIG_DIR/Config.plist"

if [ -f "$IOS_CONFIG" ]; then
    echo "  [skip] iOS Config.plist already exists"
else
    if [ -f "$IOS_EXAMPLE" ]; then
        cp "$IOS_EXAMPLE" "$IOS_CONFIG"
        echo "  [created] $IOS_CONFIG"
        echo "            Please edit and add your MCD_MCP_TOKEN"
    else
        echo "  [error] Example file not found: $IOS_EXAMPLE"
    fi
fi

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit the Config.plist files and add your MCD_MCP_TOKEN"
echo "  2. Build and run:"
echo "     - macOS: swift run --package-path apps/macos/MCD-macOS"
echo "     - iOS:   Open apps/ios/MCD-iOS/MCD-iOS.xcodeproj in Xcode"

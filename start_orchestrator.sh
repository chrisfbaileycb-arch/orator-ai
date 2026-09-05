#!/bin/bash
# ==============================================================================
# The Orchestrator Platform - Appliance Launcher
# Zero-dependency, pure Python 3.13 Standard Library + Modern HTML5/WebGL HUD
# ==============================================================================

set -e

PORT=${PORT:-8080}
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================================="
echo "   THE ORCHESTRATOR - DIGITAL MANUFACTURING APPLIANCE"
echo "   Starting ephemeral in-memory server on port ${PORT}..."
echo "   Directory: ${APP_DIR}"
echo "=================================================================="

cd "${APP_DIR}"
python3 server.py

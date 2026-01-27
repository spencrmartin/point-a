#!/bin/bash

# Point A - Development Startup Script
# Starts both API and web in development mode with hot reload

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📍 Starting Point A (Development Mode)...${NC}"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Dependencies missing. Installing...${NC}"
    pnpm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install dependencies${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
fi

# Run turbo dev (starts all packages in dev mode)
echo -e "${BLUE}Starting development servers...${NC}"
echo ""
pnpm dev

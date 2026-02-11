#!/bin/bash

# Point A - Startup Script
# Starts both API backend and web frontend

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📍 Starting Point A...${NC}"
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

# Check if packages are built
if [ ! -d "packages/api/dist" ] || [ ! -d "packages/web/dist" ]; then
    echo -e "${YELLOW}Packages not built. Building...${NC}"
    pnpm build
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to build packages${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Packages built${NC}"
    echo ""
fi

# Start API in background
echo -e "${BLUE}Starting API server...${NC}"
cd packages/api
pnpm start > ../../api.log 2>&1 &
API_PID=$!
cd ../..
echo -e "${GREEN}✓ API started (PID: $API_PID)${NC}"

# Wait a moment for API to start
sleep 2

# Start web frontend in background
echo -e "${BLUE}Starting web frontend...${NC}"
cd packages/web
pnpm preview > ../../web.log 2>&1 &
WEB_PID=$!
cd ../..
echo -e "${GREEN}✓ Web frontend started (PID: $WEB_PID)${NC}"

echo ""
echo -e "${GREEN}✨ Point A is running!${NC}"
echo ""
echo "  Frontend: http://localhost:4173"
echo "  API:      http://localhost:3001"
echo ""
echo "  API logs: tail -f api.log"
echo "  Web logs: tail -f web.log"
echo ""
echo "To stop Point A, run: ./stop.sh"
echo ""

# Save PIDs for stop script
echo "$API_PID" > .api.pid
echo "$WEB_PID" > .web.pid

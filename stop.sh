#!/bin/bash

# Point A - Stop Script
# Stops both API and web servers

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Stopping Point A...${NC}"
echo ""

# Stop API
if [ -f .api.pid ]; then
    API_PID=$(cat .api.pid)
    if ps -p $API_PID > /dev/null 2>&1; then
        echo -e "${BLUE}Stopping API (PID: $API_PID)...${NC}"
        kill $API_PID
        echo -e "${GREEN}✓ API stopped${NC}"
    else
        echo -e "${RED}API process not found${NC}"
    fi
    rm .api.pid
else
    echo -e "${RED}No API PID file found${NC}"
fi

# Stop web frontend
if [ -f .web.pid ]; then
    WEB_PID=$(cat .web.pid)
    if ps -p $WEB_PID > /dev/null 2>&1; then
        echo -e "${BLUE}Stopping web frontend (PID: $WEB_PID)...${NC}"
        kill $WEB_PID
        echo -e "${GREEN}✓ Web frontend stopped${NC}"
    else
        echo -e "${RED}Web frontend process not found${NC}"
    fi
    rm .web.pid
else
    echo -e "${RED}No web frontend PID file found${NC}"
fi

# Also kill any remaining node processes on our ports
echo -e "${BLUE}Cleaning up any remaining processes...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4173 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo ""
echo -e "${GREEN}Point A stopped${NC}"

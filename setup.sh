#!/bin/bash

# Point A - Complete Setup Script
# This script installs Point A and configures it as a Goose extension

set -e  # Exit on error

echo "📍 Point A - Local-First Issue Tracker"
echo "======================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if Node.js is installed and find the best path
echo -e "${BLUE}Checking Node.js installation...${NC}"

# Try to find node - prefer nvm, then homebrew, then system
NODE_PATH=""
if [ -f "$HOME/.nvm/versions/node/$(ls -1 $HOME/.nvm/versions/node 2>/dev/null | sort -V | tail -1)/bin/node" ]; then
    NODE_PATH="$HOME/.nvm/versions/node/$(ls -1 $HOME/.nvm/versions/node | sort -V | tail -1)/bin/node"
elif command -v node &> /dev/null; then
    NODE_PATH=$(which node)
fi

if [ -z "$NODE_PATH" ]; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$($NODE_PATH --version)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ is required (found $NODE_VERSION)${NC}"
    echo "Please upgrade Node.js from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Found Node.js $NODE_VERSION at $NODE_PATH${NC}"
echo ""

# Check if pnpm is installed
echo -e "${BLUE}Checking pnpm installation...${NC}"
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm not found. Installing...${NC}"
    npm install -g pnpm
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to install pnpm${NC}"
        echo "Please install pnpm manually: npm install -g pnpm"
        exit 1
    fi
fi

PNPM_VERSION=$(pnpm --version)
echo -e "${GREEN}✓ Found pnpm $PNPM_VERSION${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
echo -e "${YELLOW}  (This may take 1-2 minutes)${NC}"
echo ""

pnpm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Rebuild native modules to match current Node version
echo -e "${BLUE}Rebuilding native modules...${NC}"
pnpm rebuild better-sqlite3 2>/dev/null || true
echo -e "${GREEN}✓ Native modules rebuilt${NC}"
echo ""

# Build all packages
echo -e "${BLUE}Building packages...${NC}"
pnpm build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to build packages${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Packages built${NC}"
echo ""

# Generate and run database migrations
echo -e "${BLUE}Setting up database...${NC}"
cd packages/api

# Check if migrations exist, if not generate them
if [ ! -d "src/db/migrations" ] || [ -z "$(ls -A src/db/migrations 2>/dev/null)" ]; then
    echo -e "${YELLOW}  Generating migrations...${NC}"
    pnpm db:generate
fi

echo -e "${YELLOW}  Running migrations...${NC}"
# Run migrations - ignore errors for already-applied migrations (duplicate column errors)
if pnpm db:migrate 2>&1; then
    echo -e "${GREEN}✓ Migrations applied${NC}"
else
    # Check if it's just a "duplicate column" error (migration already applied)
    if pnpm db:migrate 2>&1 | grep -q "duplicate column"; then
        echo -e "${YELLOW}  Migrations already applied (database is up to date)${NC}"
    else
        echo -e "${RED}Warning: Migration had issues, but continuing...${NC}"
    fi
fi

cd ../..
echo -e "${GREEN}✓ Database ready${NC}"
echo ""

# Create Point A data directory
POINTA_DIR="$HOME/.point-a"
if [ ! -d "$POINTA_DIR" ]; then
    echo -e "${BLUE}Creating Point A data directory...${NC}"
    mkdir -p "$POINTA_DIR"
    echo -e "${GREEN}✓ Created $POINTA_DIR${NC}"
else
    echo -e "${YELLOW}Point A data directory already exists${NC}"
fi
echo ""

# Configure Goose extension
GOOSE_CONFIG="$HOME/.config/goose/config.yaml"
GOOSE_CONFIG_DIR="$HOME/.config/goose"

echo -e "${BLUE}Configuring Goose extension...${NC}"

# Create goose config directory if it doesn't exist
if [ ! -d "$GOOSE_CONFIG_DIR" ]; then
    mkdir -p "$GOOSE_CONFIG_DIR"
fi

# Check if point-a extension already exists in config
if [ -f "$GOOSE_CONFIG" ] && grep -q "^  point-a:" "$GOOSE_CONFIG"; then
    echo -e "${YELLOW}Point A extension already exists in Goose config${NC}"
    echo -e "${YELLOW}Updating configuration...${NC}"
    # Remove existing point-a config
    # Create a temp file without the point-a section
    awk '
        /^  point-a:/ { skip=1; next }
        skip && /^  [a-z]/ { skip=0 }
        skip && /^[a-z]/ { skip=0 }
        !skip { print }
    ' "$GOOSE_CONFIG" > "$GOOSE_CONFIG.tmp"
    mv "$GOOSE_CONFIG.tmp" "$GOOSE_CONFIG"
fi

# Add point-a extension to Goose config
if [ -f "$GOOSE_CONFIG" ] && grep -q "^extensions:" "$GOOSE_CONFIG"; then
    # Insert point-a after "extensions:" line using a temp file approach
    awk -v script_dir="$SCRIPT_DIR" -v pointa_dir="$POINTA_DIR" -v node_path="$NODE_PATH" '
        /^extensions:/ {
            print
            print "  point-a:"
            print "    enabled: true"
            print "    type: stdio"
            print "    name: Point A"
            print "    description: Local-first issue tracker with AI integration"
            print "    cmd: " node_path
            print "    args:"
            print "      - " script_dir "/packages/mcp/dist/index.js"
            print "    envs:"
            print "      POINTA_DB_PATH: " pointa_dir "/point-a.db"
            print "    env_keys: []"
            print "    timeout: 300"
            print "    bundled: null"
            print "    available_tools: []"
            next
        }
        { print }
    ' "$GOOSE_CONFIG" > "$GOOSE_CONFIG.tmp"
    mv "$GOOSE_CONFIG.tmp" "$GOOSE_CONFIG"
    echo -e "${GREEN}✓ Point A extension added to Goose config (using $NODE_PATH)${NC}"
else
    # Create new config file with point-a extension
    cat > "$GOOSE_CONFIG" << EOF
extensions:
  point-a:
    enabled: true
    type: stdio
    name: Point A
    description: Local-first issue tracker with AI integration
    cmd: $NODE_PATH
    args:
      - $SCRIPT_DIR/packages/mcp/dist/index.js
    envs:
      POINTA_DB_PATH: $POINTA_DIR/point-a.db
    env_keys: []
    timeout: 300
    bundled: null
    available_tools: []
EOF
    echo -e "${GREEN}✓ Created Goose config with Point A extension (using $NODE_PATH)${NC}"
fi
echo ""

# Create a startup script
echo -e "${BLUE}Creating startup script...${NC}"
cat > start.sh << 'STARTEOF'
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
STARTEOF

chmod +x start.sh
echo -e "${GREEN}✓ Created start.sh${NC}"
echo ""

# Create a development startup script
echo -e "${BLUE}Creating development startup script...${NC}"
cat > dev.sh << 'DEVEOF'
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
DEVEOF

chmod +x dev.sh
echo -e "${GREEN}✓ Created dev.sh${NC}"
echo ""

# Create a stop script
echo -e "${BLUE}Creating stop script...${NC}"
cat > stop.sh << 'STOPEOF'
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
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:4173 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Clean up orphaned MCP processes
ORPHANED=$(pgrep -f "point-a/packages/mcp" 2>/dev/null | wc -l | tr -d ' ')
if [ "$ORPHANED" -gt "0" ]; then
    echo -e "${BLUE}Cleaning up $ORPHANED orphaned MCP processes...${NC}"
    pkill -f "point-a/packages/mcp" 2>/dev/null || true
    echo -e "${GREEN}✓ Orphaned MCP processes cleaned up${NC}"
fi

echo ""
echo -e "${GREEN}Point A stopped${NC}"
STOPEOF

chmod +x stop.sh
echo -e "${GREEN}✓ Created stop.sh${NC}"
echo ""

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}What was installed:${NC}"
echo "  ✓ Node.js dependencies (React, Hono, Drizzle, etc.)"
echo "  ✓ Database migrations applied"
echo "  ✓ Point A data directory: $POINTA_DIR"
echo "  ✓ Goose extension configured"
echo ""
echo -e "${BLUE}Quick Start:${NC}"
echo ""
echo -e "  ${YELLOW}1. Start Point A (production):${NC}"
echo "     ./start.sh"
echo ""
echo -e "  ${YELLOW}2. Start Point A (development with hot reload):${NC}"
echo "     ./dev.sh"
echo ""
echo -e "  ${YELLOW}3. Open in browser:${NC}"
echo "     Production: http://localhost:4173"
echo "     Development: http://localhost:5173"
echo ""
echo -e "  ${YELLOW}4. Use with Goose:${NC}"
echo "     Restart Goose Desktop to load the Point A extension."
echo "     Then you can ask Goose to create issues, manage projects, etc."
echo ""
echo -e "  ${YELLOW}5. Stop Point A:${NC}"
echo "     ./stop.sh"
echo ""
echo -e "${BLUE}MCP Tools Available in Goose:${NC}"
echo "  • list_projects, create_project"
echo "  • search_issues, get_issue, create_issue, update_issue"
echo "  • bulk_update_issues, triage_issues"
echo "  • list_labels, create_label"
echo "  • list_cycles, create_cycle"
echo "  • get_stats"
echo ""
echo -e "${BLUE}Data:${NC}"
echo "  Database: $POINTA_DIR/point-a.db"
echo ""
echo -e "${GREEN}Happy issue tracking! 📍✨${NC}"
echo ""

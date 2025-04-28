#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Web3 Passkey App with XMTP Messaging ===${NC}"
echo -e "${YELLOW}Setting up the application...${NC}"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# Setup test data
echo -e "${YELLOW}Setting up test data...${NC}"
npm run setup

# Build the application
echo -e "${YELLOW}Building the application...${NC}"
npm run build

# Start the server
echo -e "${GREEN}Starting the server...${NC}"
echo -e "${GREEN}Open your browser at http://localhost:3000${NC}"
npm run dev

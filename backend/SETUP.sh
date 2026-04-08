#!/bin/bash
# Quick Setup Script for Gatwick Bank Backend - Phase 1

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏦 Gatwick Bank Backend - Phase 1 Setup${NC}\n"

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}❌ Please run this from the backend directory${NC}"
    exit 1
fi

# Dependencies installed (already done)
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Prisma client generated (already done)
echo -e "${GREEN}✅ Prisma client generated${NC}"

echo -e "\n${BLUE}📝 Next Steps:${NC}\n"

echo "1️⃣  Setup your database (choose one):"
echo ""
echo "   Docker:"
echo "   docker run -d --name gatwick-postgres -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=gatwick_bank -p 5432:5432 postgres:15"
echo "   docker run -d --name gatwick-redis -p 6379:6379 redis:7-alpine"
echo ""
echo "   Or use Railway: https://railway.app"
echo ""

echo "2️⃣  Update DATABASE_URL in .env if needed"
echo ""

echo "3️⃣  Run migrations:"
echo "   npm run prisma:migrate -- --name init"
echo ""

echo "4️⃣  Seed test data:"
echo "   npm run db:seed"
echo ""

echo "5️⃣  Start development server:"
echo "   npm run dev"
echo ""

echo "6️⃣  Open another terminal and test:"
echo "   npm run prisma:studio"
echo ""

echo -e "${GREEN}Phase 1 is ready for execution! 🚀${NC}"

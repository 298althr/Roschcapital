#!/bin/bash
# One-time seed script for Railway
echo "🌱 Running Gatwick Bank Database Seed..."
echo "📦 Installing dependencies..."
npm install

echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "🚀 Running seed script..."
npm run seed

echo "✅ Seed complete!"

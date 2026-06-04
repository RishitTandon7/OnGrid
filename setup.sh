#!/bin/bash

# OnGrid Setup Script - Automated environment configuration

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         OnGrid Attendance System - Setup Script               ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Check prerequisites
echo "✓ Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "✗ Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "✗ npm is not installed"
    exit 1
fi

echo "✓ Node.js $(node --version)"
echo "✓ npm $(npm --version)"

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 Creating .env.local..."
    cp .env.example .env.local
    
    # Generate NEXTAUTH_SECRET
    SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    sed -i.bak 's/NEXTAUTH_SECRET="your-nextauth-secret-here"/NEXTAUTH_SECRET="'$SECRET'"/' .env.local
    rm .env.local.bak
    
    echo "✓ .env.local created with generated NEXTAUTH_SECRET"
    echo "⚠ Please update DATABASE_URL in .env.local"
else
    echo "✓ .env.local already exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Run Prisma migrations
echo ""
echo "🗄 Setting up database..."
echo ""
echo "Choose an option:"
echo "1) Run migrations (recommended for fresh setup)"
echo "2) Skip migrations (database already set up)"
echo ""
read -p "Enter your choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "Running Prisma migrations..."
    npx prisma migrate dev --name init
    
    echo ""
    echo "Seeding database with test data..."
    npm run seed
else
    echo "Skipping migrations..."
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start development server:"
echo "  npm run dev"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
echo "Test credentials:"
echo "  Teacher:  teacher@college.edu / OnGridTeacherSecure2026!"
echo "  Student:  alice@college.edu / OnGridStudentSecure2026!"

#!/bin/bash
# ==============================================================================
# 🧞 HireGenie AI (TalentOS) — 1-Click Docker Launcher (Linux / macOS / WSL)
# ==============================================================================

set -e

echo ""
echo "🚀 Starting HireGenie AI Platform on Docker..."
echo ""

# 1. Check Docker daemon
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running! Please start Docker Desktop first."
    exit 1
fi
echo "✅ Docker daemon is running."

# 2. Check for .env file
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found. Copying from backend/.env.example..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
fi

# 3. Build and launch
echo ""
echo "📦 Building and starting containers..."
docker compose up --build -d

echo ""
echo "🎉 HireGenie AI services are online!"
echo "------------------------------------------------------------------"
echo "🌐 Frontend:             http://localhost:3000"
echo "⚙️  Backend & API Docs:   http://localhost:8000/docs"
echo "🗄️  PostgreSQL:           localhost:5432"
echo "⚡ Redis:                localhost:6379"
echo "------------------------------------------------------------------"
echo ""
echo "💡 Commands:"
echo "   Logs:                 docker compose logs -f"
echo "   Seed fresher jobs:    docker exec -it hiregenie-backend python seed_fresher_jobs.py"
echo "   Stop containers:      docker compose down"
echo ""

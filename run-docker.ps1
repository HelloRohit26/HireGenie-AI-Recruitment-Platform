# ==============================================================================
# 🧞 HireGenie AI (TalentOS) — 1-Click Docker Desktop Launcher (Windows PowerShell)
# ==============================================================================

Write-Host "`n🚀 Starting HireGenie AI Platform on Docker Desktop...`n" -ForegroundColor Cyan

# 1. Verify Docker Engine is running
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker engine is not running."
    }
    Write-Host "✅ Docker Desktop is running and active." -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker Desktop is NOT running!" -ForegroundColor Red
    Write-Host "👉 Please open Docker Desktop on your PC and wait until the whale icon is green, then re-run this script.`n" -ForegroundColor Yellow
    Exit 1
}

# 2. Check for backend environment file
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env not found. Creating from backend\.env.example..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✅ Created backend\.env. Please update API keys if needed." -ForegroundColor Green
}

# 3. Check for port conflicts (8000, 3000, 5432, 6379)
$port8000 = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "⚠️  Port 8000 is currently used by a local process." -ForegroundColor Yellow
    Write-Host "   If containers fail to bind, stop your local uvicorn server or set `$env:BACKEND_PORT=8001" -ForegroundColor Yellow
}

# 4. Build and spin up containers
Write-Host "`n📦 Building and launching containers (PostgreSQL, Redis, FastAPI, Celery, React/Nginx)..." -ForegroundColor Cyan
docker compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 All HireGenie AI services are running in Docker!" -ForegroundColor Green
    Write-Host "------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "🌐 Frontend Application:     http://localhost:3000" -ForegroundColor White
    Write-Host "⚙️  Backend REST API & Docs:  http://localhost:8000/docs" -ForegroundColor White
    Write-Host "🗄️  PostgreSQL Database:     localhost:5432 (db: hiregenie, user: postgres)" -ForegroundColor White
    Write-Host "⚡ Redis Cache & Broker:     localhost:6379" -ForegroundColor White
    Write-Host "------------------------------------------------------------------" -ForegroundColor DarkGray
    
    Write-Host "`n💡 Useful Docker Commands:" -ForegroundColor Yellow
    Write-Host "   View live logs:         docker compose logs -f" -ForegroundColor Gray
    Write-Host "   Seed sample jobs:       docker exec -it hiregenie-backend python seed_fresher_jobs.py" -ForegroundColor Gray
    Write-Host "   Stop all containers:    docker compose down" -ForegroundColor Gray
    Write-Host "   Stop and clear data:    docker compose down -v`n" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Failed to start containers. Run 'docker compose logs' to inspect issues." -ForegroundColor Red
}

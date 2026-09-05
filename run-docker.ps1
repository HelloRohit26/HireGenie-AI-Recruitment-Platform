# ==============================================================================
# HireGenie AI (TalentOS) - 1-Click Docker Desktop Launcher (Windows PowerShell)
# ==============================================================================

Write-Host ""
Write-Host ">>> Starting HireGenie AI Platform on Docker Desktop..." -ForegroundColor Cyan
Write-Host ""

# 1. Verify Docker Engine is running
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker engine is not running."
    }
    Write-Host "[OK] Docker Desktop is running and active." -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Docker Desktop is NOT running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop on your PC and wait until the whale icon is green, then re-run this script." -ForegroundColor Yellow
    Write-Host ""
    Exit 1
}

# 2. Check for backend environment file
if (-not (Test-Path "backend\.env")) {
    Write-Host "[INFO] backend\.env not found. Creating from backend\.env.example..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "[OK] Created backend\.env" -ForegroundColor Green
}

# 3. Check for port 8000 conflict
$port8000 = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "[NOTE] Port 8000 is currently used by a local process." -ForegroundColor Yellow
    Write-Host "       If containers fail to bind, stop your local uvicorn or set `$env:BACKEND_PORT=8001" -ForegroundColor Yellow
}

# 4. Build and spin up containers
Write-Host ""
Write-Host ">>> Building and launching containers (PostgreSQL, Redis, FastAPI, Celery, React/Nginx)..." -ForegroundColor Cyan
docker compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] All HireGenie AI services are running in Docker!" -ForegroundColor Green
    Write-Host "------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "Frontend Application:     http://localhost:3000" -ForegroundColor White
    Write-Host "Backend API and Docs:     http://localhost:8000/docs" -ForegroundColor White
    Write-Host "PostgreSQL Database:      localhost:5432 (db: hiregenie, user: postgres)" -ForegroundColor White
    Write-Host "Redis Cache and Broker:   localhost:6379" -ForegroundColor White
    Write-Host "------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Useful Commands:" -ForegroundColor Yellow
    Write-Host "  View live logs:         docker compose logs -f" -ForegroundColor Gray
    Write-Host "  Seed fresher jobs:      docker exec -it hiregenie-backend python seed_fresher_jobs.py" -ForegroundColor Gray
    Write-Host "  Stop all containers:    docker compose down" -ForegroundColor Gray
    Write-Host "  Stop and clear data:    docker compose down -v" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to start containers. Run 'docker compose logs' to inspect issues." -ForegroundColor Red
    Write-Host ""
}

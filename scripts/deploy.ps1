# PBSportsClub API Deployment Script for Windows PowerShell
# This script handles the complete deployment process on Windows

param(
    [Parameter(Position=0)]
    [ValidateSet("deploy", "cleanup", "status", "logs", "restart")]
    [string]$Action = "deploy",
    
    [Parameter(Position=1)]
    [string]$Service = "api"
)

# Configuration
$ComposeFile = "docker-compose.yml"
$EnvFile = ".env.production.local"

# Functions
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-Requirements {
    Write-Info "Checking deployment requirements..."
    
    # Check if Docker is installed and running
    try {
        $null = docker --version
    } catch {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    }
    
    try {
        $null = docker info 2>$null
    } catch {
        Write-Error "Docker is not running. Please start Docker Desktop first."
        exit 1
    }
    
    # Check if docker-compose is available
    $composeAvailable = $false
    try {
        $null = docker-compose --version 2>$null
        $script:ComposeCmd = "docker-compose"
        $composeAvailable = $true
    } catch {
        try {
            $null = docker compose version 2>$null
            $script:ComposeCmd = "docker compose"
            $composeAvailable = $true
        } catch {
            Write-Error "Docker Compose is not available. Please install Docker Compose."
            exit 1
        }
    }
    
    # Check if environment file exists
    if (-not (Test-Path $EnvFile)) {
        Write-Warning "Production environment file not found: $EnvFile"
        Write-Info "Creating from template..."
        Copy-Item ".env.production" $EnvFile
        Write-Warning "Please update $EnvFile with your production values before continuing."
        Write-Warning "Especially update JWT_SECRET and database passwords!"
        exit 1
    }
    
    Write-Success "All requirements met"
}

function Build-Images {
    Write-Info "Building Docker images..."
    
    & $ComposeCmd --env-file $EnvFile build --no-cache
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build Docker images"
        exit 1
    }
    
    Write-Success "Docker images built successfully"
}

function Deploy-Database {
    Write-Info "Starting database service..."
    
    # Start only the database first
    & $ComposeCmd --env-file $EnvFile up -d db
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start database"
        exit 1
    }
    
    # Wait for database to be healthy
    Write-Info "Waiting for database to be ready..."
    $timeout = 60
    while ($timeout -gt 0) {
        $status = & $ComposeCmd --env-file $EnvFile ps db
        if ($status -match "healthy") {
            Write-Success "Database is ready"
            break
        }
        Start-Sleep -Seconds 2
        $timeout -= 2
    }
    
    if ($timeout -le 0) {
        Write-Error "Database failed to start within timeout"
        exit 1
    }
}

function Invoke-Migrations {
    Write-Info "Running database migrations and seeding..."
    
    # Run migrations using the migration profile
    & $ComposeCmd --env-file $EnvFile --profile migration up db-migrate
    
    # Clean up the migration container
    & $ComposeCmd --env-file $EnvFile --profile migration rm -f db-migrate
    
    Write-Success "Database migrations completed"
}

function Deploy-Api {
    Write-Info "Starting API service..."
    
    # Start the full stack
    & $ComposeCmd --env-file $EnvFile --profile full-stack up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start API"
        exit 1
    }
    
    # Wait for API to be healthy
    Write-Info "Waiting for API to be ready..."
    $timeout = 60
    while ($timeout -gt 0) {
        $status = & $ComposeCmd --env-file $EnvFile ps api
        if ($status -match "healthy") {
            Write-Success "API is ready"
            break
        }
        Start-Sleep -Seconds 2
        $timeout -= 2
    }
    
    if ($timeout -le 0) {
        Write-Error "API failed to start within timeout"
        exit 1
    }
}

function Show-Status {
    Write-Info "Deployment status:"
    & $ComposeCmd --env-file $EnvFile ps
    
    Write-Host ""
    Write-Success "🎉 Deployment completed successfully!"
    
    # Get API port from environment or use default
    $apiPort = $env:API_PORT
    if (-not $apiPort) { $apiPort = "3000" }
    
    Write-Info "API is available at: http://localhost:$apiPort"
    Write-Info "API Documentation: http://localhost:$apiPort/docs"
    Write-Info "Health Check: http://localhost:$apiPort/health"
}

function Invoke-Cleanup {
    Write-Info "Cleaning up..."
    & $ComposeCmd --env-file $EnvFile down --remove-orphans
    docker system prune -f
    Write-Success "Cleanup completed"
}

# Main deployment process
switch ($Action) {
    "deploy" {
        Write-Info "🚀 Starting PBSportsClub API deployment..."
        Test-Requirements
        Build-Images
        Deploy-Database
        Invoke-Migrations
        Deploy-Api
        Show-Status
    }
    "cleanup" {
        Invoke-Cleanup
    }
    "status" {
        & $ComposeCmd --env-file $EnvFile ps
    }
    "logs" {
        & $ComposeCmd --env-file $EnvFile logs -f $Service
    }
    "restart" {
        Write-Info "Restarting services..."
        & $ComposeCmd --env-file $EnvFile --profile full-stack restart
        Write-Success "Services restarted"
    }
    default {
        Write-Host "Usage: .\deploy.ps1 [deploy|cleanup|status|logs|restart] [service]"
        Write-Host "  deploy  - Full deployment (default)"
        Write-Host "  cleanup - Stop and clean up all containers"
        Write-Host "  status  - Show service status"
        Write-Host "  logs    - Show service logs (optionally specify service name)"
        Write-Host "  restart - Restart all services"
        exit 1
    }
}
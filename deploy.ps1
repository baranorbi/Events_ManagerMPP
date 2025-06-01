param(
    [switch]$ForceSSL,
    [switch]$StartTunnel
)

Write-Host "Starting Events Manager deployment for Cloudflare Pages..." -ForegroundColor Green

# Check if SSL certificates need to be generated
$certExists = Test-Path "ssl\cert.pem"
$keyExists = Test-Path "ssl\key.pem"

if (-not $certExists -or -not $keyExists -or $ForceSSL) {
    Write-Host "Generating SSL certificates..." -ForegroundColor Yellow
    .\generate-ssl.ps1
}

# Get public IP
try {
    $publicIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10).Trim()
    Write-Host "Your public IP: $publicIP" -ForegroundColor Yellow
} catch {
    $publicIP = "your-public-ip"
    Write-Host "Could not determine public IP" -ForegroundColor Yellow
}

# Get local IP
try {
    $localIP = Get-NetIPConfiguration | 
               Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq "Up" } | 
               Select-Object -First 1 -ExpandProperty IPv4Address | 
               Select-Object -ExpandProperty IPAddress
               
    if (-not $localIP) {
        $localIP = "192.168.1.5"
    }
} catch {
    $localIP = "192.168.1.5"
}

# Create SSL bypass for testing
add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

# Stop and clean up existing containers
Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans
docker system prune -f

# Build and start services
Write-Host "Building and starting services..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait for services
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service status
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose ps

# Test the deployment
Write-Host "Testing deployment..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "https://localhost/" -UseBasicParsing -TimeoutSec 30
    Write-Host "HTTPS Frontend responding: $($response.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode) {
        Write-Host "HTTPS Frontend: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    } else {
        Write-Host "HTTPS Frontend failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

try {
    $apiResponse = Invoke-WebRequest -Uri "https://localhost/api/events/" -UseBasicParsing -TimeoutSec 30
    Write-Host "API responding: $($apiResponse.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode) {
        Write-Host "API: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    } else {
        Write-Host "API failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Local access: https://localhost" -ForegroundColor Cyan
Write-Host "Cloudflare Pages domain: https://events-managermpp.pages.dev" -ForegroundColor Cyan

# Start Cloudflare tunnel if requested
if ($StartTunnel) {
    Write-Host ""
    Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Yellow
    
    if (Test-Path "cloudflare\cloudflared.exe") {
        cd cloudflare
        Write-Host "Connecting events-managermpp.pages.dev to your local server..." -ForegroundColor Green
        .\cloudflared.exe tunnel run events-manager-tunnel
    } else {
        Write-Host "Cloudflared not found. Please run Cloudflare setup first." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Access Options:" -ForegroundColor Yellow
Write-Host "1. Local: https://localhost" -ForegroundColor White
Write-Host "2. LAN: https://$localIP" -ForegroundColor White
Write-Host "3. Cloudflare Pages: https://events-managermpp.pages.dev (with tunnel)" -ForegroundColor White
Write-Host ""
Write-Host "To start Cloudflare Tunnel: .\deploy.ps1 -StartTunnel" -ForegroundColor Yellow
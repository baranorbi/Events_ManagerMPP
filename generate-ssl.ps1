Write-Host "Generating SSL certificates using Docker..." -ForegroundColor Green

# Create SSL directory
New-Item -ItemType Directory -Force -Path "ssl"

# Get your actual local IP
try {
    $localIP = Get-NetIPConfiguration | 
               Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq "Up" } | 
               Select-Object -First 1 -ExpandProperty IPv4Address | 
               Select-Object -ExpandProperty IPAddress
               
    if (-not $localIP) {
        $localIP = "192.168.1.5"  # Your actual IP as fallback
    }
} catch {
    $localIP = "192.168.1.5"  # Your actual IP as fallback
}

Write-Host "Creating certificate for localhost, $localIP, and events-managermpp.pages.dev" -ForegroundColor Yellow

# Use Docker with OpenSSL to generate certificates with multiple SANs including Cloudflare domain
try {
    docker run --rm -v "${PWD}/ssl:/ssl" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /ssl/key.pem -out /ssl/cert.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$localIP,DNS:events-managermpp.pages.dev,DNS:*.pages.dev"

    # Check if both files exist and have content
    $certExists = Test-Path "ssl/cert.pem"
    $keyExists = Test-Path "ssl/key.pem"
    
    if ($certExists -and $keyExists) {
        $certSize = (Get-Item "ssl/cert.pem").Length
        $keySize = (Get-Item "ssl/key.pem").Length
        
        if ($certSize -gt 0 -and $keySize -gt 0) {
            Write-Host "✅ SSL certificates generated successfully!" -ForegroundColor Green
            Write-Host "Files created:" -ForegroundColor Yellow
            Write-Host "  - ssl/key.pem (private key) - $keySize bytes" -ForegroundColor Yellow
            Write-Host "  - ssl/cert.pem (certificate) - $certSize bytes" -ForegroundColor Yellow
            Write-Host "  - Valid for: localhost, $localIP, events-managermpp.pages.dev" -ForegroundColor Yellow
            Write-Host "  - Expires: 365 days from now" -ForegroundColor Yellow
        } else {
            Write-Host "❌ SSL certificate files exist but are empty" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Failed to generate SSL certificates" -ForegroundColor Red
        Write-Host "  - Certificate exists: $certExists" -ForegroundColor Yellow
        Write-Host "  - Private key exists: $keyExists" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Docker SSL generation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure Docker is running" -ForegroundColor Yellow
}
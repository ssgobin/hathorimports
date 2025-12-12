#!/usr/bin/env pwsh
# Script de teste da API Hathor Imports

$API_URL = "http://localhost:4000"

Write-Host "🧪 Testando API do Hathor Imports" -ForegroundColor Green
Write-Host "URL Base: $API_URL" -ForegroundColor Cyan
Write-Host ""

# Teste 1: Health Check
Write-Host "[1] Health Check" -ForegroundColor Yellow
try {
  $response = Invoke-RestMethod -Uri "$API_URL/api/health" -Method Get
  Write-Host "Status: $($response.status)" -ForegroundColor Green
  Write-Host "Uptime: $($response.uptime)s" -ForegroundColor Gray
} catch {
  Write-Host "Erro: $_" -ForegroundColor Red
}

Write-Host ""

# Teste 2: URL Inválida
Write-Host "[2] Validação - URL Inválida" -ForegroundColor Yellow
try {
  $body = @{url = "not-a-valid-url"} | ConvertTo-Json
  $response = Invoke-RestMethod -Uri "$API_URL/api/import/yupoo" -Method Post `
    -ContentType "application/json" -Body $body
  Write-Host "Resposta: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
  $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
  Write-Host "Validação funcionando: $($errorResponse.error.message)" -ForegroundColor Green
}

Write-Host ""

# Teste 3: Domínio não permitido
Write-Host "[3] Validação - Domínio não permitido" -ForegroundColor Yellow
try {
  $body = @{url = "https://example.com/product"} | ConvertTo-Json
  $response = Invoke-RestMethod -Uri "$API_URL/api/import/yupoo" -Method Post `
    -ContentType "application/json" -Body $body
  Write-Host "Resposta: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
  $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
  Write-Host "Validação funcionando: $($errorResponse.error.message)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Testes de API concluídos!" -ForegroundColor Green

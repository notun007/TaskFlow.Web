$ErrorActionPreference = 'Stop'

$webRoot = Split-Path -Parent $PSScriptRoot
$apiProject = [IO.Path]::GetFullPath((Join-Path $webRoot '..\TaskFlow.Api\TaskFlow.Api\TaskFlow.Api.csproj'))
$apiDll = [IO.Path]::GetFullPath((Join-Path $webRoot '..\TaskFlow.Api\TaskFlow.Api\bin\Debug\net10.0\TaskFlow.Api.dll'))
$apiUrl = 'http://localhost:5183'
$apiPort = 5183
$webPort = 4200
$startedApi = $null

if (-not (Test-Path -LiteralPath $apiProject)) {
  throw "TaskFlow.Api project was not found at $apiProject"
}
if (-not (Test-Path -LiteralPath $apiDll)) {
  throw "TaskFlow.Api has not been built. Build $apiProject once, then run npm start again."
}

function Test-HttpEndpoint([string]$url) {
  try {
    Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 | Out-Null
    return $true
  } catch {
    return [bool]$_.Exception.Response
  }
}

if (-not (Test-HttpEndpoint "$apiUrl/api/auth/me")) {
  Write-Host "Starting TaskFlow.Api on $apiUrl..." -ForegroundColor Cyan
  $startedApi = Start-Process `
    -FilePath 'dotnet' `
    -ArgumentList @($apiDll, '--urls', $apiUrl) `
    -WorkingDirectory (Split-Path -Parent $apiDll) `
    -WindowStyle Hidden `
    -PassThru

  $deadline = (Get-Date).AddSeconds(90)
  while (-not (Test-HttpEndpoint "$apiUrl/api/auth/me") -and (Get-Date) -lt $deadline) {
    if ($startedApi.HasExited) {
      throw 'TaskFlow.Api stopped before it became ready. Run the API project directly to inspect its startup error.'
    }
    Start-Sleep -Milliseconds 500
  }

  if (-not (Test-HttpEndpoint "$apiUrl/api/auth/me")) {
    Stop-Process -Id $startedApi.Id -Force -ErrorAction SilentlyContinue
    throw "TaskFlow.Api did not start listening on $apiUrl within 90 seconds."
  }
}

Write-Host "TaskFlow.Api is ready on $apiUrl." -ForegroundColor Green
if (Test-HttpEndpoint "http://localhost:$webPort") {
  Write-Host 'TaskFlow.Web is already running on http://localhost:4200.' -ForegroundColor Green
  exit 0
}
Write-Host 'Starting TaskFlow.Web on http://localhost:4200...' -ForegroundColor Cyan

try {
  & npm run start:web
} finally {
  if ($startedApi -and -not $startedApi.HasExited) {
    Stop-Process -Id $startedApi.Id -Force -ErrorAction SilentlyContinue
  }
}

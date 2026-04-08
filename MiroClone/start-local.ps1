param(
  [int]$Port = 8080
)

$ErrorActionPreference = "Continue"

Write-Host "Starting local server for BoardSpace at http://localhost:$Port" -ForegroundColor Cyan

function Try-RunServer {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )

  Write-Host "Trying: $Command $($Arguments -join ' ')" -ForegroundColor DarkCyan
  & $Command @Arguments
  $code = $LASTEXITCODE

  if ($code -eq 0) {
    return $true
  }

  Write-Warning "Command failed with exit code $code"
  return $false
}

if (Get-Command python -ErrorAction SilentlyContinue) {
  if (Try-RunServer -Command "python" -Arguments @("-m", "http.server", "$Port")) {
    exit 0
  }
}

if (Get-Command py -ErrorAction SilentlyContinue) {
  if (Try-RunServer -Command "py" -Arguments @("-m", "http.server", "$Port")) {
    exit 0
  }
}

if (Get-Command npx -ErrorAction SilentlyContinue) {
  if (Try-RunServer -Command "npx" -Arguments @("http-server", ".", "-p", "$Port", "-c-1")) {
    exit 0
  }
}

Write-Error "Could not start a local server. Install Python or Node.js, then run this script again."
exit 1

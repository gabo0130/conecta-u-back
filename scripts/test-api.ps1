param(
  [string]$BaseUrl = 'http://localhost:3001/api',
  [Parameter(Mandatory=$true)][string]$Email,
  [Parameter(Mandatory=$true)][string]$Password
)

Write-Host "Testing API at $BaseUrl" -ForegroundColor Cyan

$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json

try {
  Write-Host "POST $BaseUrl/auth/login" -ForegroundColor Yellow
  $loginResp = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $loginBody -ContentType 'application/json'
} catch {
  Write-Host "Login request failed:" -ForegroundColor Red
  Write-Host $_.Exception.Message
  exit 2
}

if (-not $loginResp.access_token) {
  Write-Host "No access_token returned from /auth/login" -ForegroundColor Red
  Write-Host ($loginResp | ConvertTo-Json -Depth 5)
  exit 3
}

$token = $loginResp.access_token
Write-Host "Login successful. Token length: $($token.Length)" -ForegroundColor Green
Write-Host "User:" -NoNewline; Write-Host ($loginResp.user | ConvertTo-Json -Depth 5)

try {
  Write-Host "GET $BaseUrl/auth/me" -ForegroundColor Yellow
  $me = Invoke-RestMethod -Uri "$BaseUrl/auth/me" -Method Get -Headers @{ Authorization = "Bearer $token" }
  Write-Host "Authenticated /auth/me response:" -ForegroundColor Green
  Write-Host ($me | ConvertTo-Json -Depth 5)
} catch {
  Write-Host "Request to /auth/me failed:" -ForegroundColor Red
  Write-Host $_.Exception.Message
  exit 4
}

Write-Host "Menu from login response:" -ForegroundColor Cyan
Write-Host ($loginResp.user.menu | ConvertTo-Json -Depth 5)

Write-Host "Done." -ForegroundColor Cyan

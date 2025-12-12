$url = 'https://ovosneaker.x.yupoo.com/albums/189035799?uid=1&isSubCate=false&referrercate=4640401'
$body = @{ url = $url } | ConvertTo-Json

Write-Host "POST /api/import/yupoo/save -> $url" -ForegroundColor Cyan
try {
  $res = Invoke-RestMethod -Uri 'http://localhost:4000/api/import/yupoo/save' -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 120
  Write-Host "Saved file: $($res.savedFile)" -ForegroundColor Green
  Write-Host "Images found: $($res.data.images.Count)" -ForegroundColor Green
  $res.data.images | ForEach-Object { Write-Host $_ }
} catch {
  Write-Host "Erro: $_" -ForegroundColor Red
}

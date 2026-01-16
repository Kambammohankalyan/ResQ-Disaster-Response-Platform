Write-Host "--- STARTING INFRASTRUCTURE ---"
docker-compose up -d
if ($?) {
    Write-Host "Infra started. Waiting 15s for DB init..."
    Start-Sleep -s 15
} else {
    Write-Host "Docker failed to start."
    exit 1
}

Write-Host "--- RUNNING CONNECTIVITY TEST ---"
pnpm --filter api exec ts-node test-roles-connectivity.ts

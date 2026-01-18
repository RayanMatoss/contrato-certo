# Script para renomear src/pages para src/views
$sourcePath = Join-Path $PSScriptRoot "src\pages"
$destPath = Join-Path $PSScriptRoot "src\views"

if (Test-Path $sourcePath) {
    Move-Item -Path $sourcePath -Destination $destPath -Force
    Write-Host "Pasta renomeada com sucesso de 'src\pages' para 'src\views'"
} else {
    Write-Host "Pasta 'src\pages' não encontrada"
}


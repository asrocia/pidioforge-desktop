# Fix last 3 TypeScript errors

# Fix TemplatesPanel.tsx - remove unused variable assignment
$templatesPanel = "src\components\panels\TemplatesPanel.tsx"
if (Test-Path $templatesPanel) {
    $content = Get-Content $templatesPanel -Raw
    $content = $content -replace "const _data = await api", "await api"
    Set-Content $templatesPanel $content -NoNewline
    Write-Host "Fixed: TemplatesPanel.tsx"
}

# Fix RenderProgressCard.tsx - prefix unused variable
$renderProgress = "src\components\ui\RenderProgressCard.tsx"
if (Test-Path $renderProgress) {
    $content = Get-Content $renderProgress -Raw
    $content = $content -replace "const isCancelled", "const _isCancelled"
    Set-Content $renderProgress $content -NoNewline
    Write-Host "Fixed: RenderProgressCard.tsx"
}

# Fix Toast.tsx - remove unused import
$toast = "src\components\ui\Toast.tsx"
if (Test-Path $toast) {
    $content = Get-Content $toast -Raw
    $content = $content -replace "import \{ useCallback, ", "import { "
    Set-Content $toast $content -NoNewline
    Write-Host "Fixed: Toast.tsx"
}

Write-Host "`nAll 3 final errors fixed!"

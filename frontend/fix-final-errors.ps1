# Fix final TypeScript errors - prefix unused variables with underscore

# Fix AudioMixingPanel.tsx
$audioMixing = "src\components\panels\AudioMixingPanel.tsx"
if (Test-Path $audioMixing) {
    $content = Get-Content $audioMixing -Raw
    $content = $content -replace "const updateStemPan", "const _updateStemPan"
    Set-Content $audioMixing $content -NoNewline
    Write-Host "Fixed: AudioMixingPanel.tsx"
}

# Fix PreviewPane.tsx
$previewPane = "src\components\panels\PreviewPane.tsx"
if (Test-Path $previewPane) {
    $content = Get-Content $previewPane -Raw
    $content = $content -replace "const _job = jobs", "// const _job = jobs"
    $content = $content -replace "async function diagnostics\(\)", "async function _diagnostics()"
    Set-Content $previewPane $content -NoNewline
    Write-Host "Fixed: PreviewPane.tsx"
}

# Fix QueuePanel.tsx
$queuePanel = "src\components\panels\QueuePanel.tsx"
if (Test-Path $queuePanel) {
    $content = Get-Content $queuePanel -Raw
    $content = $content -replace "const \[showPerf\]", "const [_showPerf]"
    $content = $content -replace "const \[showManual\]", "const [_showManual]"
    $content = $content -replace "const \[showBatch\]", "const [_showBatch]"
    $content = $content -replace "const \[showList\]", "const [_showList]"
    $content = $content -replace "const \[showQueueLog\]", "const [_showQueueLog]"
    $content = $content -replace "const \[showQueueControls\]", "const [_showQueueControls]"
    Set-Content $queuePanel $content -NoNewline
    Write-Host "Fixed: QueuePanel.tsx"
}

Write-Host "`nAll final errors fixed!"

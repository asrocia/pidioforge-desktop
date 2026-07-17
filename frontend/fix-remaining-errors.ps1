# Fix remaining TypeScript errors

# Fix QueuePanel.tsx - remove unused state variables
$queuePanel = "src\components\panels\QueuePanel.tsx"
if (Test-Path $queuePanel) {
    $content = Get-Content $queuePanel -Raw
    # Comment out unused state variables
    $content = $content -replace "const \[showQueueControls, setShowQueueControls\]", "const [showQueueControls] = useState(true); // setShowQueueControls removed"
    $content = $content -replace "const \[showPerf, setShowPerf\]", "const [showPerf] = useState(false); // setShowPerf removed"
    $content = $content -replace "const \[showManual, setShowManual\]", "const [showManual] = useState(false); // setShowManual removed"
    $content = $content -replace "const \[showBatch, setShowBatch\]", "const [showBatch] = useState(false); // setShowBatch removed"
    $content = $content -replace "const \[showList, setShowList\]", "const [showList] = useState(false); // setShowList removed"
    $content = $content -replace "const \[showQueueLog, setShowQueueLog\]", "const [showQueueLog] = useState(false); // setShowQueueLog removed"
    Set-Content $queuePanel $content -NoNewline
    Write-Host "Fixed: QueuePanel.tsx"
}

# Fix TargetPanel.tsx - remove unused import
$targetPanel = "src\components\panels\TargetPanel.tsx"
if (Test-Path $targetPanel) {
    $content = Get-Content $targetPanel -Raw
    $content = $content -replace ", FileDropIndicator", ""
    Set-Content $targetPanel $content -NoNewline
    Write-Host "Fixed: TargetPanel.tsx"
}

# Fix TemplatesPanel.tsx - remove unused variables
$templatesPanel = "src\components\panels\TemplatesPanel.tsx"
if (Test-Path $templatesPanel) {
    $content = Get-Content $templatesPanel -Raw
    $content = $content -replace ", updateConfig", ""
    $content = $content -replace "const \{ data \}", "const { data: _data }"
    Set-Content $templatesPanel $content -NoNewline
    Write-Host "Fixed: TemplatesPanel.tsx"
}

# Fix Toast.tsx - remove unused imports
$toast = "src\components\ui\Toast.tsx"
if (Test-Path $toast) {
    $content = Get-Content $toast -Raw
    $content = $content -replace ", useCallback", ""
    $content = $content -replace "interface ToastContextValue", "// interface ToastContextValue"
    Set-Content $toast $content -NoNewline
    Write-Host "Fixed: Toast.tsx"
}

# Fix VirtualList.tsx - remove unused imports
$virtualList = "src\components\ui\VirtualList.tsx"
if (Test-Path $virtualList) {
    $content = Get-Content $virtualList -Raw
    $content = $content -replace ", useEffect", ""
    $content = $content -replace ", CSSProperties", ""
    Set-Content $virtualList $content -NoNewline
    Write-Host "Fixed: VirtualList.tsx"
}

# Fix config-path.ts - replace .at() with array indexing
$configPath = "src\lib\config-path.ts"
if (Test-Path $configPath) {
    $content = Get-Content $configPath -Raw
    $content = $content -replace "\.at\(-1\)", "[parts.length - 1]"
    Set-Content $configPath $content -NoNewline
    Write-Host "Fixed: config-path.ts"
}

# Fix format.ts - remove unused import
$format = "src\lib\format.ts"
if (Test-Path $format) {
    $content = Get-Content $format -Raw
    $content = $content -replace "import \{ getDeep \} from './config-path';\r?\n", ""
    Set-Content $format $content -NoNewline
    Write-Host "Fixed: format.ts"
}

# Fix media.ts - prefix unused parameter
$media = "src\utils\media.ts"
if (Test-Path $media) {
    $content = Get-Content $media -Raw
    $content = $content -replace "export function copyText\(text: string\)", "export function copyText(_text: string)"
    Set-Content $media $content -NoNewline
    Write-Host "Fixed: media.ts"
}

# Fix performance.ts - prefix unused parameters
$performance = "src\utils\performance.ts"
if (Test-Path $performance) {
    $content = Get-Content $performance -Raw
    $content = $content -replace "startTime: number,", "_startTime: number,"
    $content = $content -replace "commitTime: number", "_commitTime: number"
    $content = $content -replace "getOptimizedImageUrl\(url: string, width: number, quality: number", "getOptimizedImageUrl(url: string, _width: number, _quality: number"
    Set-Content $performance $content -NoNewline
    Write-Host "Fixed: performance.ts"
}

Write-Host "`nAll remaining errors fixed!"

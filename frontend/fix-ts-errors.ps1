# Fix TypeScript compilation errors

# Fix unused React imports (remove React from imports that use JSX transform)
$files = @(
    "src\App.tsx",
    "src\components\ErrorBoundary.tsx",
    "src\components\panels\AudioMixingPanel.tsx",
    "src\components\panels\BrandingPanel.tsx",
    "src\components\panels\HelpPanel.tsx",
    "src\components\panels\LoopingPanel.tsx",
    "src\components\panels\LyricsPanel.tsx",
    "src\components\panels\OverlayPanel.tsx",
    "src\components\panels\SettingsPanel.tsx",
    "src\components\panels\TemplatesPanel.tsx",
    "src\components\ui\ModuleIcon.tsx",
    "src\components\ui\OptimizedComponents.tsx",
    "src\components\ui\RenderProgressCard.tsx",
    "src\components\ui\Toast.tsx",
    "src\main.tsx"
)

foreach ($file in $files) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        # Remove 'React, ' from imports
        $content = $content -replace "import React, \{", "import {"
        # Remove standalone 'import React from' lines
        $content = $content -replace "import React from 'react';\r?\n", ""
        Set-Content $path $content -NoNewline
        Write-Host "Fixed: $file"
    }
}

Write-Host "`nAll files processed!"

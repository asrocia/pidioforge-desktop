# PidioForge Desktop - Test Runner Script
# This script runs all tests and generates coverage reports

param(
    [string]$TestType = "all",
    [switch]$Watch,
    [switch]$Coverage,
    [switch]$Verbose
)

Write-Host "🧪 PidioForge Desktop Test Runner" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Change to frontend directory
Set-Location -Path "$PSScriptRoot\frontend"

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Build test command
$testCommand = "npm test"
$testArgs = @()

# Add test type filter
switch ($TestType.ToLower()) {
    "unit" {
        Write-Host "🔬 Running Unit Tests..." -ForegroundColor Green
        $testArgs += "--testPathPattern='(test|spec)\.(ts|tsx)$'"
        $testArgs += "--testPathIgnorePatterns='integration|e2e|performance'"
    }
    "integration" {
        Write-Host "🔗 Running Integration Tests..." -ForegroundColor Green
        $testArgs += "--testPathPattern='integration\.(test|spec)\.(ts|tsx)$'"
    }
    "performance" {
        Write-Host "⚡ Running Performance Tests..." -ForegroundColor Green
        $testArgs += "--testPathPattern='performance\.(test|spec)\.(ts|tsx)$'"
    }
    "all" {
        Write-Host "🎯 Running All Tests..." -ForegroundColor Green
    }
    default {
        Write-Host "❌ Invalid test type: $TestType" -ForegroundColor Red
        Write-Host "Valid options: all, unit, integration, performance" -ForegroundColor Yellow
        exit 1
    }
}

# Add watch mode
if ($Watch) {
    Write-Host "👀 Watch mode enabled" -ForegroundColor Cyan
    $testArgs += "--watch"
}

# Add coverage
if ($Coverage) {
    Write-Host "📊 Coverage reporting enabled" -ForegroundColor Cyan
    $testArgs += "--coverage"
}

# Add verbose
if ($Verbose) {
    Write-Host "📝 Verbose mode enabled" -ForegroundColor Cyan
    $testArgs += "--verbose"
}

Write-Host ""
Write-Host "Running: $testCommand $($testArgs -join ' ')" -ForegroundColor Gray
Write-Host ""

# Run tests
$testCmd = "npm test -- $($testArgs -join ' ')"
Invoke-Expression $testCmd

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    
    if ($Coverage) {
        Write-Host ""
        Write-Host "📊 Coverage report generated in: frontend/coverage/" -ForegroundColor Cyan
        Write-Host "   Open coverage/lcov-report/index.html to view detailed report" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Some tests failed!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test Summary:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host "Test Type: $TestType" -ForegroundColor Gray
Write-Host "Watch Mode: $Watch" -ForegroundColor Gray
Write-Host "Coverage: $Coverage" -ForegroundColor Gray
Write-Host "Verbose: $Verbose" -ForegroundColor Gray
Write-Host "Exit Code: $exitCode" -ForegroundColor Gray

exit $exitCode

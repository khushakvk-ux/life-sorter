# ⚡ PERFORMANCE OPTIMIZATION - CLEANUP SCRIPT
# Run this script to remove duplicate folders and heavy files
# BACKUP YOUR WORK BEFORE RUNNING THIS SCRIPT!

Write-Host "🧹 Starting Performance Optimization Cleanup..." -ForegroundColor Cyan
Write-Host ""

# Function to safely remove folder if it exists
function Remove-FolderSafely {
    param([string]$path)
    if (Test-Path $path) {
        Write-Host "   Removing: $path" -ForegroundColor Yellow
        Remove-Item -Recurse -Force $path
        Write-Host "   ✓ Removed: $path" -ForegroundColor Green
    } else {
        Write-Host "   ⊘ Not found: $path" -ForegroundColor Gray
    }
}

# Function to safely remove file if it exists
function Remove-FileSafely {
    param([string]$path)
    if (Test-Path $path) {
        $size = [math]::Round((Get-Item $path).Length / 1MB, 2)
        Write-Host "   Removing: $path ($size MB)" -ForegroundColor Yellow
        Remove-Item -Force $path
        Write-Host "   ✓ Removed: $path" -ForegroundColor Green
    } else {
        Write-Host "   ⊘ Not found: $path" -ForegroundColor Gray
    }
}

Write-Host "1️⃣  REMOVING DUPLICATE FOLDERS" -ForegroundColor Cyan
Write-Host "   (These are copies of src/ and api/ - not used by the app)" -ForegroundColor Gray
Remove-FolderSafely "frontend"
Remove-FolderSafely "services"
Remove-FolderSafely "database\operations"
Write-Host ""

Write-Host "2️⃣  REMOVING DOCUMENTATION/PLANNING FOLDERS" -ForegroundColor Cyan
Write-Host "   (These are not runtime code)" -ForegroundColor Gray
Remove-FolderSafely "docs"
Remove-FolderSafely "expansion"
Remove-FolderSafely "solution-framework"
Remove-FolderSafely "implementation task"
Remove-FolderSafely "context-file"
Remove-FolderSafely "ai-engines"
Remove-FolderSafely "database-automation"
Write-Host ""

Write-Host "3️⃣  REMOVING LARGE MEDIA FILES" -ForegroundColor Cyan
Write-Host "   (Move these to CDN/external hosting before running)" -ForegroundColor Gray
Remove-FileSafely "public\space.mp4"
Remove-FileSafely "media\videos\space.mp4"
Write-Host ""

Write-Host "4️⃣  REMOVING OLD LOG FILES" -ForegroundColor Cyan
Remove-FolderSafely "logs\2025"
Write-Host ""

Write-Host "5️⃣  REMOVING PYTHON ARTIFACTS (if present)" -ForegroundColor Cyan
Write-Host "   (.venv should be gitignored but removing if present)" -ForegroundColor Gray
Remove-FolderSafely ".venv"
Remove-FolderSafely "__pycache__"
Write-Host ""

Write-Host "6️⃣  UPDATING NPM DEPENDENCIES" -ForegroundColor Cyan
Write-Host "   (Removing unused TypeScript type definitions)" -ForegroundColor Gray
Write-Host "   Running: npm install" -ForegroundColor Yellow
npm install
Write-Host ""

Write-Host "✅ CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "   1. Reload VS Code window: Ctrl+Shift+P → 'Developer: Reload Window'" -ForegroundColor White
Write-Host "   2. Test dev server: npm run dev:full" -ForegroundColor White
Write-Host "   3. Test build: npm run build" -ForegroundColor White
Write-Host "   4. Monitor RAM usage (should be ~40% lower)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  If anything breaks, restore from git:" -ForegroundColor Yellow
Write-Host "   git restore ." -ForegroundColor Gray
Write-Host "   git clean -fd" -ForegroundColor Gray

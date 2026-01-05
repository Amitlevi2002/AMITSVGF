# Upload project to GitHub
# Run this script from the project root directory

Write-Host "🚀 Uploading project to GitHub..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Expected directories: backend/ and frontend/" -ForegroundColor Yellow
    exit 1
}

# Initialize git if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "📦 Initializing git repository..." -ForegroundColor Yellow
    git init
}

# Add remote if not exists
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔗 Adding remote repository..." -ForegroundColor Yellow
    git remote add origin https://github.com/Amitlevi2002/AMITSVGF.git
} else {
    Write-Host "✅ Remote already configured: $remoteExists" -ForegroundColor Green
    git remote set-url origin https://github.com/Amitlevi2002/AMITSVGF.git
}

# Add all files
Write-Host "📝 Adding files to git..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --short
if ($status) {
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    git commit -m "Initial commit: SVG Design Manager project"
} else {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Cyan
}

# Rename branch to main if needed
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "🌿 Renaming branch to main..." -ForegroundColor Yellow
    git branch -M main
}

# Push to GitHub
Write-Host "⬆️  Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully uploaded to GitHub!" -ForegroundColor Green
    Write-Host "🔗 Repository: https://github.com/Amitlevi2002/AMITSVGF.git" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    Write-Host "   Please check your GitHub credentials and try again" -ForegroundColor Yellow
}

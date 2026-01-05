# Deployment script for GitHub Pages
Write-Host "🚀 Starting deployment process..." -ForegroundColor Cyan
Write-Host ""

# Find project directory
$projectPath = (Get-ChildItem -Path "C:\Users\amitl\OneDrive" -Recurse -Directory -Filter "amit SVG" -ErrorAction SilentlyContinue | Select-Object -First 1).FullName

if (-not $projectPath) {
    Write-Host "❌ Could not find project directory" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath
Write-Host "📁 Working in: $projectPath" -ForegroundColor Green
Write-Host ""

# Step 1: Install dependencies
Write-Host "📦 Step 1: Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "✅ node_modules already exists" -ForegroundColor Green
}

# Step 2: Build
Write-Host "`n🔨 Step 2: Building frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed successfully" -ForegroundColor Green

# Step 3: Copy dist to root
Set-Location ..
Write-Host "`n📋 Step 3: Copying dist contents to root..." -ForegroundColor Yellow
if (Test-Path "frontend/dist") {
    if (Test-Path "dist") {
        Write-Host "⚠️  Removing existing dist directory..." -ForegroundColor Yellow
        Remove-Item -Path "dist" -Recurse -Force
    }
    Write-Host "📁 Copying files from frontend/dist to root..." -ForegroundColor Cyan
    Get-ChildItem -Path "frontend/dist" | Copy-Item -Destination "." -Recurse -Force
    Write-Host "✅ Files copied successfully" -ForegroundColor Green
} else {
    Write-Host "❌ frontend/dist directory not found!" -ForegroundColor Red
    exit 1
}

# Step 4: Verify index.html
Write-Host "`n✅ Step 4: Verifying index.html exists in root..." -ForegroundColor Yellow
if (Test-Path "index.html") {
    Write-Host "✅ index.html found in root" -ForegroundColor Green
} else {
    Write-Host "❌ index.html not found in root!" -ForegroundColor Red
    exit 1
}

# Step 5: Git add
Write-Host "`n📝 Step 5: Adding files to git..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files added to git" -ForegroundColor Green

# Step 6: Git commit
Write-Host "`n💾 Step 6: Committing changes..." -ForegroundColor Yellow
git commit -m "Deploy: Build frontend and copy dist to root for GitHub Pages"
Write-Host "✅ Changes committed" -ForegroundColor Green

# Step 7: Git push
Write-Host "`n⬆️  Step 7: Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    exit 1
}

# Step 8: Instructions
Write-Host "`n📋 Step 8: GitHub Pages Configuration" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT: Please configure GitHub Pages manually:" -ForegroundColor Cyan
Write-Host "   1. Go to: https://github.com/Amitlevi2002/AMITSVGF/settings/pages" -ForegroundColor White
Write-Host "   2. Set Source: Deploy from a branch" -ForegroundColor White
Write-Host "   3. Set Branch: main" -ForegroundColor White
Write-Host "   4. Set Folder: / (root)" -ForegroundColor White
Write-Host "   5. Click Save" -ForegroundColor White
Write-Host ""
Write-Host "✅ All deployment steps completed!" -ForegroundColor Green
Write-Host "🔗 Your site will be available at: https://amitlevi2002.github.io/AMITSVGF/" -ForegroundColor Cyan


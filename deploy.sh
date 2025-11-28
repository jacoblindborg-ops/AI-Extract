#!/bin/bash

# Akeneo AI Enrichment - Deploy Script

echo "🚀 Deploying Akeneo AI Enrichment Iframe..."

# Build the app
echo ""
echo "📦 Building app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Git operations
echo ""
echo "📝 Committing changes..."
git add .
git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"

echo ""
echo "🔄 Pushing to GitHub..."
git push origin main

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Push failed. You may need to set up git credentials."
    echo ""
    echo "To set up GitHub token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Generate new token (classic) with 'repo' scope"
    echo "3. When prompted for password, use the token"
    echo ""
    exit 1
fi

echo ""
echo "✅ Deployed to GitHub!"
echo ""
echo "📍 Repository: https://github.com/jacoblindborg-ops/AI-Extract"
echo ""
echo "Next steps:"
echo "1. Go to https://vercel.com/new"
echo "2. Import your GitHub repository"
echo "3. Deploy!"
echo ""

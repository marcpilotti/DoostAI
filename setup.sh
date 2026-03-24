#!/bin/bash
# ═══════════════════════════════════════
# DOOST AI — Quick Start Setup
# Run this BEFORE your first Claude Code prompt
# ═══════════════════════════════════════

set -e

echo "🚀 Doost AI — Setting up development environment"
echo ""

# ─── Check prerequisites ───
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install Node.js 22+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Node.js $NODE_VERSION found. Need 22+. Update: https://nodejs.org"
    exit 1
fi
echo "  ✅ Node.js $(node -v)"

if ! command -v pnpm &> /dev/null; then
    echo "  📦 Installing pnpm..."
    npm install -g pnpm
fi
echo "  ✅ pnpm $(pnpm -v)"

if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Install from https://git-scm.com"
    exit 1
fi
echo "  ✅ Git $(git --version | cut -d' ' -f3)"

echo ""

# ─── Create project directory ───
echo "Creating project directory..."
mkdir -p doost
cd doost

# ─── Initialize git ───
if [ ! -d ".git" ]; then
    git init
    echo "  ✅ Git initialized"
fi

# ─── Copy project files ───
echo "Setting up project files..."

# Copy CLAUDE.md (must be in same directory as this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/CLAUDE.md" ]; then
    cp "$SCRIPT_DIR/CLAUDE.md" ./CLAUDE.md
    echo "  ✅ CLAUDE.md copied"
fi

if [ -f "$SCRIPT_DIR/env.example" ]; then
    cp "$SCRIPT_DIR/env.example" ./.env.example
    echo "  ✅ .env.example copied"
fi

if [ -f "$SCRIPT_DIR/schema.ts" ]; then
    mkdir -p reference
    cp "$SCRIPT_DIR/schema.ts" ./reference/schema.ts
    echo "  ✅ Database schema reference copied"
fi

# ─── Create .env.local if not exists ───
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local 2>/dev/null || true
    echo "  ⚠️  .env.local created — fill in your API keys!"
fi

# ─── Create .gitignore ───
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build
.next/
dist/
.turbo/
out/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Debug
npm-debug.log*
pnpm-debug.log*

# Sentry
.sentryclirc

# Vercel
.vercel/

# Reference files (not part of build)
reference/
EOF
echo "  ✅ .gitignore created"

echo ""
echo "═══════════════════════════════════════"
echo "✅ Setup complete!"
echo "═══════════════════════════════════════"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Fill in .env.local with your API keys:"
echo "   - Clerk: https://dashboard.clerk.com"
echo "   - Supabase: https://supabase.com/dashboard"
echo "   - Anthropic: https://console.anthropic.com"
echo "   - OpenAI: https://platform.openai.com"
echo "   - Firecrawl: https://firecrawl.dev"
echo "   - Stripe: https://dashboard.stripe.com"
echo ""
echo "2. Apply for ad platform access (DO THIS NOW):"
echo "   - Meta Business Verification: https://business.facebook.com"
echo "   - Google Ads MCC: https://ads.google.com/home/tools/manager-accounts/"
echo "   - LinkedIn API: https://developer.linkedin.com"
echo ""
echo "3. Open Claude Code and start with Prompt 1.1:"
echo "   cd doost"
echo "   claude"
echo ""
echo "4. Paste prompts from PROMPTS.md one at a time"
echo ""

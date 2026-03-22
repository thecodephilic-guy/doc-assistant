#!/bin/bash
set -e # Exit immediately if any command fails

APP_USER="docassistant"
APP_DIR="/var/www/doc-assistant"

echo "=================================================="
echo "  Doc-Assistant Production Setup"
echo "=================================================="
echo "Please paste your production environment variables."
echo "(Press Enter after pasting each one)"
echo ""

# --- 1. PROMPT FOR SECRETS FIRST ---
read -p "DATABASE_URL (Neon): " INPUT_DB_URL
read -p "GEMINI_API_KEY: " INPUT_GEMINI_KEY
read -p "CLERK_PUBLISHABLE_KEY: " INPUT_CLERK_PUB
read -p "CLERK_SECRET_KEY: " INPUT_CLERK_SEC
read -p "REDIS_URL (Upstash): " INPUT_REDIS_URL

echo ""
echo "Variables captured! Starting server configuration..."
echo "=================================================="

# --- 2. UPDATE SYSTEM ---
echo "Updating apt repositories..."
sudo apt update && sudo apt upgrade -y

# --- 3. CREATE USER ---
echo "Creating restricted user: $APP_USER..."
if id "$APP_USER" &>/dev/null; then
    echo "User $APP_USER already exists. Skipping."
else
    sudo useradd -m -s /bin/bash "$APP_USER"
fi

# --- 4. INSTALL NODE.JS (v20 LTS) ---
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# --- 5. INSTALL CADDY ---
echo "Installing Caddy..."
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

# --- 6. CREATE DIRECTORIES ---
echo "Setting up directory: $APP_DIR..."
sudo mkdir -p "$APP_DIR"
sudo mkdir -p "$APP_DIR/uploads"

# --- 7. INJECT THE .ENV FILE ---
echo "Writing protected .env file..."
# We use standard variables here so the shell evaluates the inputs we captured earlier
sudo tee "$APP_DIR/.env" > /dev/null <<EOF
NODE_ENV=production
PORT=8000

# Database
DATABASE_URL=$INPUT_DB_URL

# AI
GEMINI_API_KEY=$INPUT_GEMINI_KEY

# Auth
CLERK_PUBLISHABLE_KEY=$INPUT_CLERK_PUB
CLERK_SECRET_KEY=$INPUT_CLERK_SEC

# Queue
REDIS_URL=$INPUT_REDIS_URL
EOF

# --- 8. LOCK DOWN PERMISSIONS ---
echo "Securing permissions..."
sudo chown -R $APP_USER:$APP_USER "$APP_DIR"
sudo chmod 600 "$APP_DIR/.env"

echo "=================================================="
echo "✅ Setup complete!"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Your .env file is safely locked down at $APP_DIR/.env"
echo "=================================================="
#!/bin/bash

# Script pour démarrer le projet entier (Django + Next.js)
# Utilisation: ./start.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend_PPM"

echo "🚀 Démarrage du projet e-Proc UCP"
echo "=================================="

# Vérifier que nous sommes au bon endroit
if [ ! -f "$BACKEND_DIR/manage.py" ]; then
    echo "❌ Erreur: backend introuvable dans $BACKEND_DIR"
    exit 1
fi

echo ""
echo "1️⃣  Démarrage du serveur Django (Backend)..."
echo "   Port: http://localhost:8000"
echo ""

# Lancer Django en arrière-plan
cd "$ROOT_DIR"
source .venv/bin/activate
python "$BACKEND_DIR/manage.py" runserver &
DJANGO_PID=$!

sleep 2

echo ""
echo "2️⃣  Démarrage du serveur Next.js (Frontend)..."
echo "   Port: http://localhost:3001 (ou 3000)"
echo ""

# Lancer Next.js en arrière-plan
cd "$ROOT_DIR/ucp-frontend"
npm run dev &
NEXTJS_PID=$!

echo ""
echo "✅ Les deux serveurs sont lancés!"
echo ""
echo "📍 Accédez à: http://localhost:3001"
echo ""
echo "🛑 Pour arrêter, appuyez sur Ctrl+C"
echo ""

# Attendre l'interruption
wait

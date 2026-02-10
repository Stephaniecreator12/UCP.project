#!/bin/bash

# Script pour démarrer le projet entier (Django + Next.js)
# Utilisation: ./start.sh

echo "🚀 Démarrage du projet e-Proc UCP"
echo "=================================="

# Vérifier que nous sommes au bon endroit
if [ ! -f "manage.py" ]; then
    echo "❌ Erreur: Lancez ce script depuis le dossier racine (/home/stephanie/UCP)"
    exit 1
fi

echo ""
echo "1️⃣  Démarrage du serveur Django (Backend)..."
echo "   Port: http://localhost:8000"
echo ""

# Lancer Django en arrière-plan
source .venv/bin/activate
python manage.py runserver &
DJANGO_PID=$!

sleep 2

echo ""
echo "2️⃣  Démarrage du serveur Next.js (Frontend)..."
echo "   Port: http://localhost:3001 (ou 3000)"
echo ""

# Lancer Next.js en arrière-plan
cd ucp-frontend
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

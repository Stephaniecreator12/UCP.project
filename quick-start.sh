#!/bin/bash

# 🚀 SCRIPT DE DÉMARRAGE RAPIDE - e-Proc UCP
# 
# Ce script démarre automatiquement les deux serveurs (Django + Next.js)
# dans des onglets séparés du terminal (si tmux est disponible)
# 
# Utilisation:
#   chmod +x quick-start.sh
#   ./quick-start.sh

echo "🚀 Démarrage e-Proc UCP"
echo "======================"
echo ""

# Vérifier qu'on est au bon endroit
if [ ! -f "manage.py" ]; then
    echo "❌ ERREUR: Placez-vous dans le dossier /home/stephanie/UCP"
    echo "   cd /home/stephanie/UCP && ./quick-start.sh"
    exit 1
fi

# Vérifier si tmux est disponible
if command -v tmux &> /dev/null; then
    echo "✅ tmux détecté - démarrage en onglets séparés"
    echo ""
    
    # Créer une nouvelle session tmux
    tmux new-session -d -s "ucp" -x 200 -y 50
    
    # Onglet 1 : Django
    tmux send-keys -t "ucp" "cd /home/stephanie/UCP && source .venv/bin/activate && echo '🟢 Backend Django en cours de démarrage...' && python manage.py runserver" Enter
    sleep 3
    
    # Onglet 2 : Next.js
    tmux new-window -t "ucp"
    tmux send-keys -t "ucp" "cd /home/stephanie/UCP/ucp-frontend && echo '🟢 Frontend Next.js en cours de démarrage...' && npm run dev" Enter
    
    # Afficher les infos
    sleep 2
    echo ""
    echo "✅ Serveurs lancés!"
    echo ""
    echo "📍 Accédez à l'application: http://localhost:3001"
    echo ""
    echo "📊 Panel tmux:"
    echo "   - Onglet 1: Django Backend (port 8000)"
    echo "   - Onglet 2: Next.js Frontend (port 3001)"
    echo ""
    echo "Commandes tmux:"
    echo "   tmux attach -t ucp       (Se connecter)"
    echo "   Ctrl+B + n               (Onglet suivant)"
    echo "   Ctrl+B + p               (Onglet précédent)"
    echo "   Ctrl+B + d               (Détacher)"
    echo ""
    
    # Attacher à la session
    tmux attach -t "ucp"
else
    echo "⚠️  tmux non trouvé"
    echo ""
    echo "📝 Démarrage manuel en deux terminaux:"
    echo ""
    echo "Terminal 1 (Backend Django):"
    echo "  cd /home/stephanie/UCP"
    echo "  source .venv/bin/activate"
    echo "  python manage.py runserver"
    echo ""
    echo "Terminal 2 (Frontend Next.js):"
    echo "  cd /home/stephanie/UCP/ucp-frontend"
    echo "  npm run dev"
    echo ""
    echo "Puis visitez: http://localhost:3001"
fi

# 🏛️ e-Proc UCP - Système de Gestion des Procurements

**Version améliorée et moderne avec React + Django**

## 📋 Vue d'ensemble

C'est un système de gestion des appels d'offres et procurements pour l'UCP (Unité de Coordination des Procurements).

- **Backend** : Django REST API (Python)
- **Frontend** : Next.js + React (JavaScript/TypeScript)
- **Base de données** : SQLite

---

## ✨ Fonctionnalités

✅ Créer des procurements  
✅ Voir la liste de tous les procurements  
✅ Afficher les détails d'un procurement  
✅ Supprimer des procurements  
✅ Sauvegarder automatiquement en base de données

---

## 🛠️ Installation

### **Prérequis**

- Python 3.10+
- Node.js 18+
- pip et npm

### **Étape 1 : Cloner ou télécharger le projet**

```bash
cd /home/stephanie/UCP
```

### **Étape 2 : Installer les dépendances Python**

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### **Étape 3 : Installer les dépendances JavaScript**

```bash
cd ucp-frontend
npm install
cd ..
```

---

## 🚀 Démarrage Rapide

### **Option 1 : Lancer les deux serveurs manuellement**

**Terminal 1 - Django (Backend)**

```bash
cd /home/stephanie/UCP
source .venv/bin/activate
python manage.py runserver
```

**Terminal 2 - Next.js (Frontend)**

```bash
cd /home/stephanie/UCP/ucp-frontend
npm run dev
```

Puis ouvrez : **http://localhost:3001**

### **Option 2 : Script automatisé**

```bash
cd /home/stephanie/UCP
chmod +x start.sh
./start.sh
```

---

## 📖 Guide Complet

Pour débuter sans te perdre, lis d'abord:

- `docs/essentiels/START_HERE.txt`
- `docs/essentiels/GUIDE_UTILISATION.md`
- `docs/essentiels/TROUBLESHOOTING.md` (si problème)

---

## 📁 Structure du Projet

```
UCP/
├── manage.py                    ← Django
├── db.sqlite3                   ← Base de données
├── requirements.txt             ← Dépendances Python
├── start.sh                     ← Script de démarrage
├── docs/                         ← Documentation (rangée)
│   ├── essentiels/               ← À lire (débutante)
│   └── archive/                  ← Notes/anciens guides (optionnel)
│
├── UCP/                         ← Configuration Django
│   ├── settings.py              ← Paramètres
│   ├── urls.py                  ← Routes
│   └── wsgi.py
│
├── procurement/                 ← App principale
│   ├── models.py                ← Modèles (Procurement, Proposal)
│   ├── views.py                 ← API Endpoints
│   ├── serializers.py           ← Convertisseurs JSON
│   └── urls.py                  ← Routes API
│
├── eProcUCP/                    ← App secondaire
│   └── ...
│
└── ucp-frontend/                ← Application Next.js
    ├── package.json
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx          ← Accueil
    │   │   ├── create/page.tsx   ← Créer
    │   │   └── detail/[id]/page.tsx ← Détails
    │   ├── components/
    │   │   ├── ProcurementForm.tsx
    │   │   └── ProcurementList.tsx
    │   └── services/
    │       └── api.ts            ← Appels API
```

---

## 🔗 API REST

**Base URL** : `http://localhost:8000/api/`

### Procurements

- `GET /api/procurements/` - Lister tous
- `POST /api/procurements/` - Créer un nouveau
- `GET /api/procurements/{id}/` - Détails
- `PUT /api/procurements/{id}/` - Modifier
- `DELETE /api/procurements/{id}/` - Supprimer

### Exemple

```bash
# Créer un procurement
curl -X POST http://localhost:8000/api/procurements/ \
  -H "Content-Type: application/json" \
  -d '{
    "ref_number": "REF-2026-001",
    "title": "Audit",
    "method": "open",
    "approach": "review",
    "status": "draft"
  }'

# Lister tous
curl http://localhost:8000/api/procurements/
```

---

## 🗄️ Modèles

### Procurement

| Champ                                      | Type    | Description                           |
| ------------------------------------------ | ------- | ------------------------------------- |
| ref_number                                 | String  | Numéro unique                         |
| title                                      | String  | Titre / AGMO / Direction              |
| method                                     | Choice  | Appel d'offres / Gré à gré / ...      |
| status                                     | String  | draft / published / completed         |
| estimated_amount                           | Decimal | Montant estimé                        |
| dates                                      | Date    | Invitation, ouverture, signature, fin |
| ami, restricted_list, request_for_proposal | Boolean | Flags                                 |

---

## 🎨 Personnalisation

Le design utilise **Tailwind CSS**. Pour modifier les couleurs/styles, éditez les fichiers `.tsx` dans `src/components/` et `src/app/`.

---

## 🐛 Dépannage

### Erreur CORS

Django est configuré pour accepter les requêtes de `http://localhost:3000` et `http://localhost:3001`.

### Port 3000 déjà utilisé

Next.js basculera automatiquement sur le port `3001`.

### Les procurements ne s'affichent pas

1. Vérifiez Django : `http://localhost:8000/api/procurements/`
2. Consultez la console (F12) pour les erreurs
3. Vérifiez les migrations : `python manage.py migrate`

---

## 🚀 Déploiement

### Vercel (Frontend Next.js)

```bash
cd ucp-frontend
npm run build
# Ou déployer directement sur Vercel
```

### Heroku/Railway (Backend Django)

```bash
# Préparer pour la production
export DEBUG=False
# Configurer la base de données PostgreSQL
# Déployer via Git
```

---

## 📝 Notes

- **Base de données** : SQLite pour le développement. Passez à PostgreSQL pour la production.
- **Authentification** : À ajouter selon vos besoins.
- **Fichiers** : Les uploads de fichiers sont dans `procurement/` dossier.

---

## ❓ Questions / Problèmes

- Consultez [GUIDE_UTILISATION.md](./GUIDE_UTILISATION.md)
- Vérifiez les logs Django/Next.js dans les terminaux
- Assurez-vous que tous les serveurs tournent

---

**🎉 Bonne chance ! Consultez le guide pour plus d'aide.**

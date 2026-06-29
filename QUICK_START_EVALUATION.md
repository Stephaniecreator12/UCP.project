# 🚀 Quick Start — Module Évaluation des Offres

## 1️⃣ Backend Setup (5 minutes)

### Appliquer les migrations

```bash
cd backend_PPM
python manage.py migrate evaluation_offre
```

### Vérifier l'installation de ReportLab

```bash
pip install reportlab
```

### Créer les répertoires média

```bash
mkdir -p media/evaluation_reports
```

---

## 2️⃣ Frontend Setup (1 minute)

### Aucune installation supplémentaire requise!

- Service API: ✅ Créé (`src/services/evaluationService.ts`)
- Pages: ✅ Créées
- Composants: ✅ Créés

---

## 3️⃣ Tester le Workflow

### Scénario A: Secrétaire assign des évaluateurs

```bash
# 1. Aller sur /evaluation_offre
# 2. Cliquer "Assigner" sur une offre
# 3. Remplir les 3 évaluateurs (mode manuel)
# 4. Soumettre

# ✅ Les évaluateurs reçoivent un email avec le code d'accès
```

### Scénario B: Évaluateur accède sans compte

```bash
# 1. Ouvrir le lien de l'email OU aller sur /evaluation_offre/access
# 2. Entrer: ID Offre, Email, Code
# 3. Redirigé vers le formulaire d'évaluation
# 4. Completer les 6 étapes
# 5. Soumettre

# ✅ Données sauvegardées en base
```

### Scénario C: Évaluateur connecté

```bash
# 1. Se connecter (login normal)
# 2. Aller sur /evaluation_offre/list
# 3. Voir ses offres assignées
# 4. Cliquer "Continuer"
# 5. Formulaire 6 étapes
# 6. Soumettre

# ✅ Idem que B mais avec authentification
```

---

## 📁 Fichiers Créés

### Backend

```
backend_PPM/
├── apps/evaluation_offre/
│   ├── migrations/
│   │   ├── 0004_evaluationoffre_auth_fields.py (nouveau)
│   │   └── 0005_evaluationreport.py (nouveau)
│   ├── models/
│   │   └── evaluation_report.py (nouveau)
│   ├── services/
│   │   ├── validation_access_service.py (nouveau)
│   │   └── pdf_service.py (nouveau)
│   ├── views/
│   │   └── evaluation_view.py (modifié - ajout endpoint)
│   └── urls.py (modifié - import evaluation_access)
```

### Frontend

```
ucp-frontend/src/
├── app/evaluation_offre/
│   ├── page.tsx (secrétaire dashboard)
│   ├── access/page.tsx (accès public)
│   ├── list/page.tsx (mes évaluations)
│   ├── [id]/
│   │   ├── assign/page.tsx (formulaire assignation)
│   │   └── evaluate/page.tsx (formulaire évaluation)
│   └── components/
│       └── EvaluationForm.tsx (formulaire 6 étapes)
└── services/
    └── evaluationService.ts (API wrapper)
```

---

## 🔧 Configuration Requise

### Django Settings (déjà en place probablement)

```python
# settings.py

# Email backend pour envoi codes d'accès
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "votre-smtp.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "votre-email@example.com"
EMAIL_HOST_PASSWORD = "votre-password"
DEFAULT_FROM_EMAIL = "noreply@yourapp.com"

# Media files pour PDF
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# CORS pour frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Installed apps (déjà présent)
INSTALLED_APPS = [
    ...
    "apps.evaluation_offre",
    ...
]
```

### Frontend Env

```bash
# .env.local (dans ucp-frontend)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## ✅ Validation Post-Déploiement

### Backend Sanity Check

```bash
# Vérifier migrations
python manage.py showmigrations evaluation_offre
# Doit montrer: [X] 0004_evaluationoffre_auth_fields
#                [X] 0005_evaluationreport

# Vérifier les imports
python manage.py shell
>>> from apps.evaluation_offre.models import EvaluationReport
>>> from apps.evaluation_offre.services.validation_access_service import issue_evaluation_password
# ✅ Pas d'erreurs = OK
```

### Frontend Sanity Check

```bash
# Vérifier les pages se chargent
curl http://localhost:3000/evaluation_offre
curl http://localhost:3000/evaluation_offre/access
curl http://localhost:3000/evaluation_offre/list

# Vérifier les services importent correctement
npm run build
# ✅ Pas d'erreurs TypeScript
```

### API Endpoints Check

```bash
# Test sans auth (accès public)
curl -X POST http://localhost:8000/api/evaluation/1/access/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "eval@test.com",
    "code": "0001-TEST-ABC123"
  }'

# Test avec auth
TOKEN=$(curl -X POST http://localhost:8000/api/login/ \
  -d "username=user&password=pass" | jq -r '.access')

curl -X GET http://localhost:8000/api/evaluation/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🆘 Support Rapide

### "Je ne vois pas les offres à assigner"

- Vérifier qu'au moins 1 offre existe avec statut "VALIDEE"
- Vérifier que vous êtes dans le groupe SECRETAIRE

### "Le code d'accès ne marche pas"

- Format correct: `0001-E001-ABC123`
- Email doit correspondre à celui assigné
- Code valable 24h après génération

### "Le formulaire 6 étapes ne charge pas"

- Vérifier que EvaluationOffre existe pour cette offre
- Vérifier que l'évaluateur est assigné (code d'accès OU connecté)
- Vérifier le console browser pour erreurs (F12)

### "PDF ne se génère pas"

```bash
pip install reportlab
mkdir -p media/evaluation_reports
chmod 755 media/evaluation_reports
```

---

## 📞 Contacts & Documentation

- **Documentation complète**: Voir `IMPLEMENTATION_GUIDE_EVALUATION.md`
- **Architecture**: Voir diagramme workflow dans le guide
- **Modèles**: `backend_PPM/apps/evaluation_offre/models/`
- **Services**: `backend_PPM/apps/evaluation_offre/services/`
- **Vues**: `backend_PPM/apps/evaluation_offre/views/`

---

**Prêt à déployer!** 🎉

Exécutez:

```bash
# Backend
cd backend_PPM && python manage.py migrate evaluation_offre

# Frontend
cd ucp-frontend && npm run dev

# Visitez
http://localhost:3000/evaluation_offre
```

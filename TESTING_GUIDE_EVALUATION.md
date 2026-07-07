# Guide de Test - Évaluation d'Offres (2026-07-02)

## 🎯 Objectifs de Test

- Tester le workflow **DEMANDEUR** (création État de Besoins → DAO)
- Tester le workflow **SECRÉTAIRE** (ouverture des offres)
- Vérifier que les **emails de notification** fonctionnent

---

## 📋 Comptes de Test Disponibles

### 1️⃣ Compte DEMANDEUR

```
Email: alice@ucp.mg
Rôle: DEMANDEUR (aucun groupe)
Accès: State de Besoins + DAO
```

**Navigation:**

- Menu → `État de besoins` → Dashboard des demandes
- Menu → `DAO` → Tableau de bord des DAO
- Pour créer une demande: Dashboard → Bouton "Nouvel état"
- Pour créer un DAO: DAO Dashboard → "Ajouter un DAO"

---

### 2️⃣ Compte SECRÉTAIRE

```
Email: raf.gavi@ucp.mg
Rôle: SECRÉTAIRE
Accès: Ouverture des offres + Gestion des seances
```

**Navigation:**

- Menu → "Ouverture des offres" → Gestion des séances
- Accès aux DAO pour les valider et ouvrir les enveloppes

---

## 🔐 Démarche de Connexion

### Option 1: Connexion Locale (Simulée)

1. Accédez à `http://localhost:3000/auth/login`
2. Entrez l'email du compte:
   - **Demandeur:** `alice@ucp.mg`
   - **Secrétaire:** `raf.gavi@ucp.mg`
3. Le mot de passe n'a pas d'importance (simulation locale)

### Option 2: Vider les Cookies/LocalStorage (avant de changer de compte)

```bash
# Dans la console du navigateur (F12):
localStorage.clear()
document.cookie.split(";").forEach(c => {
  const name = c.split("=")[0].trim();
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
})
location.reload()
```

---

## 📧 Configuration des Emails

### État Actuel

```
EMAIL_BACKEND = django.core.mail.backends.console.EmailBackend
```

✅ **Les emails s'affichent dans la console Django (terminal backend)**

### Logs des Emails

Quand une action déclenche un email, regardez:

```bash
# Terminal du backend
# Les emails apparaissent sous forme:
# =============== Subject ===============
# To: user@ucp.mg
# From: noreply@ucp.local
# [Contenu du mail]
# =====================================
```

### Pour Configurer un Serveur SMTP Réel

Ajouter dans `.env.local` du backend:

```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-app-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@ucp.local
```

---

## 🧪 Scénario de Test Complet

### Phase 1: DEMANDEUR - Créer une Demande d'Achat

1. Se connecter avec **alice@ucp.mg**
2. Menu → `État de besoins` → Dashboard
3. Cliquer "Nouvel état"
4. Remplir le formulaire:
   - Objet: "Test Évaluation Offres"
   - Ajouter 1-2 besoins
   - Télécharger justificatifs si demandé
5. Cliquer "SOUMETTRE L'ÉTAT DE BESOINS"
6. ✅ Email envoyé aux validateurs (visible en console Django)

### Phase 2: SECRÉTAIRE - Créer un DAO

1. Se connecter avec **raf.gavi@ucp.mg**
2. Menu → `DAO` → Dashboard
3. Cliquer "Ajouter un DAO"
4. Remplir les infos:
   - Référence: `DAO-TEST-2026-001`
   - Title: "Test DAO Évaluation"
   - Budget estimé: Ex. 100,000
   - Date limite: Date future proche
   - Documents techniques: Uploader TDR si nécessaire
5. Cliquer "Créer le DAO"
6. ✅ Email de notification envoyé

### Phase 3: SECRÉTAIRE - Gérer Séance d'Ouverture

1. Rester connecté en tant que SECRÉTAIRE
2. Menu → Ouverture des offres
3. Créer/sélectionner une séance pour le DAO créé
4. Ajouter membres de la commission
5. Valider membres
6. Planifier date/heure d'ouverture
7. ✅ Emails de notification aux membres

---

## ✅ Checklist pour la Présentation

- [ ] **Backend lancé** → `python manage.py runserver`
- [ ] **Frontend lancé** → `npm run dev`
- [ ] **Console Django visible** → pour voir les emails
- [ ] **Compte demandeur testé** → État de besoins créé
- [ ] **Compte secrétaire testé** → DAO créé
- [ ] **Emails visibles** → dans la console Django
- [ ] **Validations OK** → pas d'erreur 404/500
- [ ] **Navigation fluide** → menus fonctionnels

---

## 🐛 Dépannage Rapide

### 404 sur les routes

- ✅ **Fixé**: Routes `/api/achats/*` et `/personnel/demande-achat/dashboard` corrigées
- Relancer frontend: `npm run dev`

### Emails non visibles

- Vérifier console Django (pas en console browser)
- Vérifier `ACHATS_NOTIFICATION_EMAILS_ENABLED=True` en backend

### Session expirée

- Vider localStorage + cookies
- Se reconnecter

---

## 📞 Contacts pour Support

- **API Backend**: http://localhost:8000/api/
- **Frontend**: http://localhost:3000
- **Docs d'API**: `/home/stephanie/firstStageDev/UCP/backend_PPM/API_ACHATS_backup_20260327.md`

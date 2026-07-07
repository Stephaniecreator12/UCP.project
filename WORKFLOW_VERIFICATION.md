# 🔍 Vérification Complète du Workflow Ouverture + Évaluation

**Date:** 2026-07-02  
**Objectif:** Valider que le workflow fonctionne correctement du début à la fin

---

## 📊 FLUX ATTENDU (selon user)

```
1. DEMANDEUR crée un DAO
   ↓
2. DATE LIMITE atteinte → DAO passe en "ouverture offre"
   ↓
3. SECRÉTAIRE saisit infos séance + membres (min 3) + offres
   ↓
4. SECRÉTAIRE → EN_VALIDATION_MEMBRES
   ├─ Membres reçoivent EMAIL + MOTPASSE UNIQUE
   ├─ Chaque membre valide/rejette via email
   ├─ Toutes les décisions enregistrées (IP, navigateur, timestamp)
   ↓
5. Tous membres validés → PRÉSIDENT reçoit EMAIL + MOTPASSE UNIQUE
   ├─ Président valide/rejette/reporte via email
   ├─ Si VALIDER → PDF PV généré
   ↓
6. SECRÉTAIRE assigne 3 ÉVALUATEURS
   ├─ Évaluateurs reçoivent EMAIL + MOTPASSE UNIQUE
   ↓
7. ÉVALUATEURS font l'évaluation (grille technique + financière)
   ├─ Consensus check si écart > 15 pts
   ├─ Chacun signe sa conclusion
   ↓
8. PDF REPORT généré (moyennes + classement)
   ↓
9. FIN
```

---

## ✅ CAS NOMINAL CODÉ - Ouverture d'Offres

### Modèles Validés

- ✅ `SeanceOuverture` avec statuts: BROUILLON → EN_SAISIE → EN_VALIDATION_MEMBRES → EN_VALIDATION_PRESIDENT → VALIDEE/REJETEE
- ✅ `OffreOuverture` liée à `SeanceOuverture`
- ✅ `MembreSeance` avec mots de passe uniques
- ✅ Champs audit: IP, navigateur, timestamp

### Transitions d'État Validées

- ✅ `EN_SAISIE` → `EN_VALIDATION_MEMBRES` (manuel via endpoint, emails envoyés)
- ✅ `EN_VALIDATION_MEMBRES` → `EN_VALIDATION_PRESIDENT` (auto quand tous membres décidé)
- ✅ `EN_VALIDATION_PRESIDENT` → `VALIDEE` (manuel, PDF généré) OU `REJETEE` OU `EN_SAISIE` (report)

### Emails & Mots de Passe

- ✅ Format mot de passe: `{REF_DOSSIER}-{ROLE_KEY}-{6_RANDOM_CHARS}`
- ✅ Hashé en DB (Django hashers)
- ✅ Consommé après 1ère utilisation (non-réutilisable)
- ✅ Email avec lien vers frontend + mot de passe en bloc coloré

### PDF & Audit

- ✅ PDF PV généré automatiquement lors de `validate_president()`
- ✅ Audit trail: date_validation, ip_adresse, navigateur enregistrés

---

## ✅ CAS NOMINAL CODÉ - Évaluation d'Offres

### Modèles Validés

- ✅ `EvaluationOffre` liée à `OffreOuverture`
- ✅ `EvaluationSeanceAssignation` pour chaque évaluateur
- ✅ Mots de passe uniques générés à l'assignation
- ✅ Workflow: Examen préliminaire → Technique → Financière → Consensus → Conclusion

### Transition Ouverture → Évaluation

- ✅ Vérification: SeanceOuverture.statut DOIT = "VALIDEE"
- ⚠️ **MANUEL:** Appel explicite à `/evaluation/dao/{id}/assigner/` (POST)
- ✅ Crée 3 × EvaluationSeanceAssignation + 3 × N × EvaluationOffre
- ✅ Emails envoyés avec mots de passe uniques

### Évaluation Workflow

- ✅ Examen préliminaire: 5 critères (tous = True pour continuer)
- ✅ Évaluation technique: 4 notes /5
- ✅ Gate: tous 3 examen OK?
- ✅ Évaluation financière: montant + rabais
- ✅ Gate: tous 3 technique complète?
- ✅ Consensus check: écart ≤ 15 pts? Sinon alerte
- ✅ Rediscussions possibles si alertes
- ✅ Conclusion: recommandation + justification + signature

### PDF Report

- ✅ Généré après consolidation des 3 évaluations
- ✅ Contient: scores consolidés, tableau détail, justification

---

## ⚠️ GAPS IDENTIFIÉS

### GAP #1: Connexion DAO (ProcurementMarket) → SeanceOuverture

**Problème:**

- `ProcurementMarket.reference_number` = "UCP/DAO/2026/0001"
- `SeanceOuverture.reference_dossier` = simple CharField
- **Pas de FK explicite** entre les deux modèles

**Impact:**

- Impossible de tracer d'où vient une SeanceOuverture
- Comment crée-t-on une SeanceOuverture? Est-ce automatique quand date_limite atteint?
- Qui peut créer une SeanceOuverture?

**À vérifier:**

```bash
grep -r "SeanceOuverture.objects.create\|post_save\|signals" backend_PPM/apps/
```

---

### GAP #2: Transition "Date limite atteint" → Ouverture

**Problème:**

- Comment sait-on qu'une date limite est atteinte?
- Y a-t-il un Celery task qui crée les SeanceOuverture automatiquement?
- Ou c'est manuel?

**À vérifier:**

```bash
ls -la backend_PPM/apps/*/tasks.py
grep -r "deadline\|date_limite" backend_PPM/apps/
```

---

### GAP #3: Assignation des Évaluateurs (MANUEL vs AUTO)

**Problème:**

- Endpoint `/evaluation/dao/{id}/assigner/` existe
- Mais **pas automatique** après validation du président
- User doit appelermanuellement le endpoint

**Impact:**

- Après que président valide et PDF généré, secrétaire doit:
  1. Aller sur `/evaluation_offre` dashboard
  2. Cliquer sur le DAO en "À assigner"
  3. Remplir les 3 évaluateurs
  4. Cliquer "Assigner"
- ❌ Pas de passage automatique

**À faire:**

- ✅ Documenter que c'est manuel
- ❌ OU implémenter automatisation post-validation président

---

### GAP #4: Vérification État "Au moins 3 Membres"

**Problème:**

- Code n'impose pas minimum 3 membres avant validation
- Secrétaire peut changer statut à EN_VALIDATION_MEMBRES avec 0 ou 1 membre
- Vérification seulement à niveau évaluation (3 évaluateurs requis)

**À vérifier:**

```bash
grep -n "EN_VALIDATION_MEMBRES" backend_PPM/apps/ouverture_offre/services/seance_service.py
```

---

### GAP #5: Authentification "Accès Privé" des Évaluateurs

**Problème:**

- Membres et président reçoivent email + motpasse
- Lien vers `/evaluation/login` avec motpasse
- **Pas de vérification email avant accès**
- N'importe qui peut entrer un email valide + n'importe quel motpasse au format

**À vérifier:**

```bash
grep -A10 "def login_evaluateur_dao" backend_PPM/apps/evaluation_offre/services/
```

---

## 🧪 PLAN DE TEST COMPLET

### Phase 1: Avant la Présentation

```
1. Vérifier qu'il existe au moins 1 ProcurementMarket (DAO)
   SELECT * FROM procurement_models_procurementmarket LIMIT 1;

2. Créer une SeanceOuverture liée à ce DAO
   - Qui peut créer? (secrétaire?)
   - Comment sait-on que c'est lié à DAO?

3. Saisir infos: date, heure, lieu, members, offres
   - Ajouter 3 membres au minimum
   - Ajouter 2-3 offres

4. Passer à EN_VALIDATION_MEMBRES
   - Vérifier emails reçus en console Django
   - Vérifier format motpasse

5. Chaque membre valide via email + motpasse
   - Tester: bon motpasse
   - Tester: mauvais motpasse

6. Vérifier transition auto vers EN_VALIDATION_PRESIDENT

7. Président valide
   - Vérifier PDF généré
   - Vérifier statut → VALIDEE

8. Assigner 3 évaluateurs (MANUEL)
   - Vérifier emails reçus
   - Vérifier motpasses générés

9. Évaluateurs font l'évaluation
   - Examen préliminaire
   - Technique
   - Financière
   - Consensus

10. Vérifier PDF Report généré
```

---

## 📋 Checklist Avant Présentation

### Infrastructure

- [ ] Backend lancé (`python manage.py runserver`)
- [ ] Frontend lancé (`npm run dev`)
- [ ] Console Django visible pour voir les emails
- [ ] Base de données prête (migrations)

### Données de Test

- [ ] Au moins 1 ProcurementMarket (DAO) créé
- [ ] Comptes de test existants:
  - [ ] alice@ucp.mg (demandeur)
  - [ ] raf.gavi@ucp.mg (secrétaire)
  - [ ] 3 évaluateurs existants (ids disponibles)

### Workflow Validé

- [ ] SeanceOuverture création possible
- [ ] Membres validation via email + motpasse
- [ ] Président validation via email + motpasse
- [ ] PDF PV généré correctement
- [ ] Assignation évaluateurs possible (manuel ou auto)
- [ ] Évaluateurs reçoivent emails
- [ ] Évaluation peut être remplie
- [ ] PDF Report généré

### Problèmes Potentiels

- [ ] Vérifier qu'il n'y a pas d'erreur 404 sur les endpoints
- [ ] Vérifier qu'il n'y a pas d'erreur de permission (403)
- [ ] Vérifier que les emails ne tombent pas en erreur

---

## 🔗 Fichiers Clés

**Ouverture d'Offres:**

- Backend: `/backend_PPM/apps/ouverture_offre/`
  - Models: `seance_ouverture.py`, `offre_ouverture.py`, `membre_seance.py`
  - Services: `seance_service.py`, `notification_service.py`, `pdf_service.py`
  - Views: `seance_view.py`
- Frontend: `/ucp-frontend/src/app/personnel/ouverture_offre/`

**Évaluation d'Offres:**

- Backend: `/backend_PPM/apps/evaluation_offre/`
  - Models: `evaluation_offre.py`, `evaluation_assignation.py`
  - Services: `evaluation_service.py`, `pdf_service.py`, `validation_access_service.py`
  - Views: `evaluation_view.py`
- Frontend: `/ucp-frontend/src/app/personnel/evaluation_offre/`

**DAO/Procurement:**

- Backend: `/backend_PPM/apps/procurement/models/procurement_market.py`

---

## 📌 Actions Prioritaires

1. **URGENT:** Vérifier la connexion DAO ↔ SeanceOuverture
2. **IMPORTANT:** Tester le workflow complet avec vrais comptes
3. **NICE-TO-HAVE:** Automatiser assignation des évaluateurs après validation président

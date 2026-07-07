# 🔍 DIAGNOSTIC FINAL - Workflow Ouverture + Évaluation

**Date:** 2026-07-02  
**Status:** ✅ Workflow compris | ⚠️ 1 BUG trouvé | 🟢 Prêt pour test

---

## 📊 DIAGRAMME RÉEL

```
1. DEMANDEUR crée DAO (ProcurementMarket)
   reference_number: "UCP/DAO/2026/0001"
   deadline: "2026-07-05 17:00"

2. Frontend détecte deadline atteint
   isDeadlineReached(market) = true
   Affichage: "READY"

3. SECRÉTAIRE crée SeanceOuverture
   reference_dossier = "UCP/DAO/2026/0001"  ← Linkage textuel
   statut = "BROUILLON"

4. SECRÉTAIRE remplit séance
   - Ajoute 3+ membres (via commission_members OU membre_ids)
   - Ajoute offres
   - Assigne président

5. SECRÉTAIRE → EN_VALIDATION_MEMBRES
   - Membres reçoivent EMAIL + MOTPASSE unique
   - Chaque membre valide/rejette via email

6. Tous membres décidé → AUTO transition EN_VALIDATION_PRESIDENT
   - Président reçoit EMAIL + MOTPASSE unique

7. Président valide
   - PDF PV généré
   - Statut = VALIDEE

8. SECRÉTAIRE assigne 3 ÉVALUATEURS (MANUEL)
   - POST /evaluation/dao/{seance_id}/assigner/
   - Évaluateurs reçoivent EMAIL + MOTPASSE unique

9. ÉVALUATEURS évaluent
   - Examen préliminaire (5 critères)
   - Technique (4 notes)
   - Financière (montant)
   - Consensus check
   - Conclusion + signature

10. PDF REPORT généré
    - Scores consolidés
    - Classement final
```

---

## ✅ VALIDÉ

| Item                  | Status | Note                                       |
| --------------------- | ------ | ------------------------------------------ |
| DAO ↔ SeanceOuverture | ✅     | Via `reference_dossier = reference_number` |
| Date limite trigger   | ✅     | Frontend détecte + UI "READY"              |
| Mots de passe uniques | ✅     | Format + hashage + single-use validés      |
| PDF PV                | ✅     | Généré auto post-validation président      |
| Emails notifications  | ✅     | Console backend affiche (mode test)        |
| Évaluation workflow   | ✅     | 3 phases + consensus check                 |
| PDF Report            | ✅     | Généré post-consolidation                  |

---

## ⚠️ BUGS/GAPS IDENTIFIÉS

### BUG #1: Validation Minimum 3 Membres ⚠️ **À CORRIGER**

**Problème:**

- Validation existe: `len(commission_members) >= 3` ✅
- Validation **MANQUE**: `len(membre_ids) >= 3` ❌

**Code (serializers/seance_serializer.py):**

```python
# Ligne ~230: Validé pour commission_members
if commission_members is not None:
    if len(commission_members) < 3:
        raise ValidationError("La commission doit contenir au moins 3 membres.")

# Ligne ~213: NON validé pour membre_ids
def validate_membre_ids(self, value):
    unique_ids = list(dict.fromkeys(value))
    if len(unique_ids) != len(value):
        raise ValidationError("Un meme membre ne doit pas apparaitre deux fois.")
    users_count = User.objects.filter(id__in=unique_ids, is_active=True).count()
    if users_count != len(unique_ids):
        raise ValidationError("Un ou plusieurs membres sont introuvables.")
    # ❌ MANQUE: if len(unique_ids) < 3
    return unique_ids
```

**Impact:**

- Secrétaire peut ajouter 1-2 membres existants → séance crée avec < 3
- Workflow fail quand tente EN_VALIDATION_MEMBRES
- Mauvaise UX

**Correction (5 min):**

```python
def validate_membre_ids(self, value):
    unique_ids = list(dict.fromkeys(value))
    if len(unique_ids) != len(value):
        raise ValidationError("Un meme membre ne doit pas apparaitre deux fois.")
    if len(unique_ids) < 3:  # ← AJOUTER CETTE LIGNE
        raise ValidationError("Au moins 3 membres requis.")
    users_count = User.objects.filter(id__in=unique_ids, is_active=True).count()
    if users_count != len(unique_ids):
        raise ValidationError("Un ou plusieurs membres sont introuvables.")
    return unique_ids
```

---

### DESIGN #2: Assignation Évaluateurs Manuelle ⚠️ **INTENTIONNEL**

**Status:** NOT a bug, but workflow step

**Current:**

- Après que président valide → secrétaire doit manuellement appeler POST `/evaluation/dao/{id}/assigner/`
- Frontend: Go to `/evaluation_offre` dashboard
- Sélectionner DAO en "À assigner"
- Remplir 3 évaluateurs
- Cliquer "Assigner"

**Options:**

1. ✅ **Garder manuel** (intentionnel pour plus de contrôle)
   - Secrétaire peut choisir timing d'assignation
   - Peut choisir les évaluateurs spécifiquement
   - Okay pour démo si bien documenté

2. ❌ **Automatiser** (plus complexe)
   - Ajouter signal post `validate_president()`
   - Trouver 3 évaluateurs automatiquement (? critères?)
   - Risque: assignation non optimale

**Recommendation:** Garder manuel pour présentation

---

### DESIGN #3: Authentification Accès Privé ⚠️ **À RENFORCER**

**Actuel:**

- Email + motpasse unique (format: `REF-KEY-RANDOM`)
- Motpasse hashé Django
- Single-use (consommé après 1ère validation)

**Sécurité Gaps:**

- ❌ Pas de rate limiting → possible brute force
- ❌ Pas de TLS/HTTPS check obligatoire
- ❌ Pas de captcha après tentatives échouées

**Pour démo:** Acceptable (env de test)  
**Pour production:** Ajouter rate limiting + HTTPS

---

## 🧪 PLAN DE TEST POUR PRÉSENTATION

### Pré-démarrage

```bash
# Terminal 1: Backend
cd backend_PPM
python manage.py runserver

# Terminal 2: Frontend
cd ucp-frontend
npm run dev

# Terminal 3: DB Reset (optionnel)
cd backend_PPM
python manage.py migrate
python manage.py seed_suppliers  # Si existe
```

### Scénario Test (15-20 min)

**Phase 1: Création DAO (2 min)**

- Se connecter en tant que demandeur (alice@ucp.mg)
- Aller à `/procurement` → "Ajouter un DAO"
- Créer:
  - Title: "Test Évaluation 2026"
  - Procedure: "AON"
  - Deadline: Aujourd'hui ou demain
  - Budget: 100,000
- Valider

**Phase 2: Créer Séance Ouverture (5 min)**

- Se connecter en tant que secrétaire (raf.gavi@ucp.mg)
- Aller à `/ouverture_offre`
- Cliquer sur DAO créé → "Créer séance"
- Remplir commission (3 personnes):
  - Email: test1@ucp.mg, test2@ucp.mg, test3@ucp.mg
  - Prenom: Test1, Test2, Test3
- Ajouter 2 offres:
  - Soumissionnaire1: "ACME Corp"
  - Soumissionnaire2: "Tech Inc"
- Assigner président (ex: nalisoa@ucp.mg)
- Cliquer "Valider"

**Phase 3: Validation Membres (3 min)**

- Vérifier console Django: emails reçus ✅
- Regarder format motpasse (copier 1 pour montrer)
- Attendre ou forcer transition (si possible)

**Phase 4: Validation Président (2 min)**

- Vérifier email président en console Django ✅
- Cliquer lien validation (ou simuler)
- Vérifier PDF PV généré

**Phase 5: Assignation Évaluateurs (3 min)**

- Rester en secrétaire
- Aller `/evaluation_offre` dashboard
- Cliquer DAO en "À assigner"
- Sélectionner 3 évaluateurs (ex: nalisoa, pfgavi, alice)
- Cliquer "Assigner"
- ✅ Vérifier console: emails envoyés

**Phase 6: Évaluation (5 min)**

- Afficher l'une des pages d'évaluation
- Montrer grille technique/financière
- Vérifier consensus check (si peut)

---

## 📋 CHECKLIST AVANT PRÉSENTATION

- [ ] **Backend:** `python manage.py runserver` lancé
- [ ] **Frontend:** `npm run dev` lancé
- [ ] **Console Django visible** pour montrer les emails
- [ ] **Data:**
  - [ ] 1 DAO existant (ou prêt à créer)
  - [ ] Comptes test: alice@ucp.mg, raf.gavi@ucp.mg
  - [ ] 3+ évaluateurs existants
- [ ] **Workflow testé:**
  - [ ] Création séance OK
  - [ ] Emails reçus ✓
  - [ ] Validation membres OK
  - [ ] Validation président OK
  - [ ] PDF généré ✓
  - [ ] Assignation évaluateurs OK
- [ ] **Erreurs:**
  - [ ] Pas de 404
  - [ ] Pas de 500
  - [ ] Pas d'erreur permission

---

## 🔴 ACTION IMMÉDIATE

**Avant de tester le workflow:**

Ajouter la validation manquante `membre_ids` minimum 3:

**Fichier:** `backend_PPM/apps/ouverture_offre/serializers/seance_serializer.py`  
**Ligne:** ~217 (dans la fonction `validate_membre_ids`)

```python
def validate_membre_ids(self, value):
    unique_ids = list(dict.fromkeys(value))
    if len(unique_ids) != len(value):
        raise serializers.ValidationError("Un meme membre ne doit pas apparaitre deux fois.")
    if len(unique_ids) < 3:  # ← AJOUTER CETTE LIGNE
        raise serializers.ValidationError("La commission doit contenir au moins 3 membres.")
    users_count = User.objects.filter(id__in=unique_ids, is_active=True).count()
    if users_count != len(unique_ids):
        raise serializers.ValidationError("Un ou plusieurs membres sont introuvables.")
    return unique_ids
```

Puis relancer le backend.

---

## ✅ Conclusion

**État du workflow:** 🟢 **Opérationnel avec 1 petit bug**

- ✅ Archit complète comprendre et fonctionnelle
- ✅ Mots de passe + emails implémentés correctement
- ✅ PDF + audit trail en place
- ✅ Workflow logique et cohérent
- ⚠️ 1 validation manquante (facile à corriger)
- ⚠️ Assignation évaluateurs manuelle (OK pour démo)

**Recommendation:**

1. Corriger rapidement la validation `membre_ids`
2. Tester scénario complet avant la présentation
3. Documenter pour démonstrateurs: "Assignation évaluateurs est une étape manuelle après validation président"

Good to go! 🚀

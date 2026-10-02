# Guide de présentation — `/presentation` (mode projection plein écran)

Page vitrine dédiée à la démonstration devant jury : `src/app/presentation/page.tsx`.
Route publique (hors `/personnel`, donc non filtrée par `src/middleware.tsx`) — aucun token, aucun groupe requis.
100 % mockée (`useState` local), aucun appel `services/*`, aucun `getToken()`.
Aucun champ de notes/commentaires jury à l'écran : seul le contenu métier est projeté.

## Lancement

```bash
cd ucp-frontend
npm run dev
# ouvrir http://localhost:3000/presentation
# passer le navigateur en plein écran (F11)
```

## Structure de la page

- **Header** : badge « Mode présentation », rappel « 100% mocké », recherche plein texte, filtre présentateur (Tous/P1–P4), barre de progression des éléments vus.
- **Sidebar (gauche)** : 10 groupes, 41 formulaires + dashboards. Un clic = un élément dans la zone principale. Checkmarks ✓/○ de suivi.
- **Zone principale** : bandeau vert (rôle d'origine contourné) + bloc utilité ámbré (🎯 utilité, 📜 règles, 🎤 script à lire) + le formulaire/dashboard mocké + navigation Précédent/Suivant.
- **Toast** : `.ucp-toast--success` (réutilise `globals.css`) sur chaque soumission simulée.

Tous les formulaires utilisent `useState` local + `onSubmit={(e) => { e.preventDefault(); notify(...) }}`.

## Catalogue (41 éléments)

### 1. Authentification — P1/P2
| # | Élément sidebar | Fichier réel répliqué | Rôle contourné |
|---|---|---|---|
| 1 | Connexion | `src/app/auth/login/page.tsx` | Public |
| 2 | Inscription fournisseur | `src/app/auth/public/register/page.tsx` | Public |
| 3 | Vérification e-mail | `src/app/auth/verify-email/page.tsx` | Public |
| 4 | Login évaluateur DAO | `src/app/personnel/evaluation/login/page.tsx` | Évaluateur isolé (code DAO) |

### 2. Demande d'achat — création — P1
| # | Élément | Réel | Rôle contourné |
|---|---|---|---|
| 5 | État de besoins (Matériels + Services, routage TDR/ST) | `personnel/demande-achat/new/page.tsx` | Demandeur |
| 6 | Correction (A_COMPLETER + PJ PDF) | `personnel/demande-achat/corriger/[id]/page.tsx` | Demandeur propriétaire |

### 3. Workflow validation → clôture — P2/P3
| # | Élément | Réel | Rôle contourné |
|---|---|---|---|
| 7 | Validation multi-étapes (5 étapes + donnees_etape) | `demande-achat/components/ValidationModal.tsx` | Valideurs + Finance |
| 8 | Imputation budgétaire | `BudgetModal.tsx` | Finance |
| 9 | Bon de commande | `PassationModal.tsx` | Agent achat |
| 10 | Suivi expédition | `LivraisonModal.tsx` | Marché/Logistique |
| 11 | Réception + écarts + PJ | `ReceptionModal.tsx` | Logistique |
| 12 | Résolution d'écart | `ResolveIssueModal.tsx` | Logistique |
| 13 | Clôture + satisfaction | `ClotureModal.tsx` | Demandeur/Logistique |

### 4. Marchés & DAO publics — P2/P4
| # | Élément | Réel | Rôle contourné |
|---|---|---|---|
| 14 | Publication marché (7 sections) | `personnel/procurement/components/procurementForm.tsx` | Agent marché |
| 15 | Édition marché (deleted IDs) | `procurement/components/procurementUpdateForm.tsx` | Agent marché |
| 16 | Planning PPMP (grille + mot de passe) | `personnel/formulaire/page.tsx` | Admin |
| 17 | DAO publics + fiche [id] | `procurement/page.tsx` + `[id]/page.tsx` | Public |

### 5. Séances d'ouverture — P3/P4
| # | Élément | Réel | Rôle contourné |
|---|---|---|---|
| 18 | Nouvelle séance (commission ≥ 3) | `personnel/ouverture_offre/new/page.tsx` | Admin/Secrétaire |
| 19 | Saisie membres (CIN 12) | `personnel/ouverture_offre/membres/page.tsx` | Secrétaire |
| 20 | Validation publique (lien e-mail) | `personnel/ouverture_offre/validation/[id]/page.tsx` | Commission sans JWT |
| 21 | Validation composition | `personnel/ouverture_offre/validation-membres/page.tsx` | RPM/GP/CN |
| 22 | Détail séance [id] (plis, enveloppes, scellé, commission, PV) | `personnel/ouverture_offre/[id]/page.tsx` → `components/SeanceOuvertureDetail.tsx` | Secrétaire/Admin |
| 23 | Aiguillage validation (secrétaire / membre 4 étapes + accès direct) | `personnel/validation-ouverture/page.tsx` | Secrétaire + Commission |

### 6. Évaluation des offres — P2/P4
| # | Élément | Réel | Rôle contourné |
|---|---|---|---|
| 24 | Wizard 6 étapes (double aveugle, 60/40) | `evaluation/components/EvaluationWizardForm.tsx` | Évaluateur assigné |
| 25 | Évaluation 4 étapes (legacy) | `evaluation_offre/components/EvaluationForm.tsx` | Évaluateur |
| 26 | Assignation 3 évaluateurs | `evaluation_offre/[id]/assign/page.tsx` | Secrétaire évaluation |
| 27 | Offres + classement final | `evaluation/classement/[seanceId]/page.tsx` | Évaluateur/Secrétaire |
| 28 | Mes évaluations assignées (badges EXAMEN→CONSOLIDEE) | `evaluation_offre/list/page.tsx` | Évaluateur |

### 7. TDR / ST — P1
| # | Élément | Réel | Rôle contourné |
|---|---|---|---|
| 29 | Nouveau TDR/ST | `personnel/TdrSt/new/page.tsx` | Demandeur |
| 30 | Suivi + décisions | `personnel/TdrSt/formulaire/page.tsx` | Point focal/Gestionnaire |
| 31 | Brouillon express (modale 2 champs) | `personnel/TdrSt/formulaire/components/DocumentFormModal.tsx` | Demandeur |

### 8. Contractualisation — P4
| # | Élément | Réel | Rôle contourné |
|---|---|---|---|
| 32 | Init contrat (rang 1 auto) | `personnel/contractualisation/new/page.tsx` | Secrétaire |
| 33 | Dossier NOTI5 (5 sections, 100 %) | `personnel/contractualisation/[id]/page.tsx` | Secrétaire contractualisation |

### 9. Espaces métier — P3
| # | Élément | Réel | Rôle contourné |
|---|---|---|---|
| 34 | Validation / Passation / Logistique (filtres partagés) | `validation/page.tsx` + `passation/page.tsx` + `logistique/page.tsx` | Valideurs / Achats / Logistique |

### 10. Dashboards analytiques — P1/P2/P3/P4
| # | Élément | Réel | Rôle contourné |
|---|---|---|---|
| 35 | Dashboard passations (donuts) | `personnel/dashboard/page.tsx` | Personnel connecté |
| 36 | Radar demande-achat (12 sections) | `personnel/demande-achat/dashboard/page.tsx` | Tous |
| 37 | Analytics TDR/ST | `personnel/TdrSt/dashboard/page.tsx` | Pilotes |
| 38 | Admin DAO & traçabilité | `personnel/log-dashboard/page.tsx` | Admin |
| 39 | Suivi contractualisation | `personnel/contractualisation/page.tsx` | Secrétaire |
| 40 | Pilotage évaluation + ouvertures | `evaluation_offre/page.tsx` + `ouverture_offre/page.tsx` | Secrétaire |
| 41 | PPM admin Django (back-office, filtres GET + donuts + 4 tables) | `backend_PPM/apps/ppm/views/dashboard_view.py` + `templates/admin/ppm/dashboard.html` | Admin Django (staff) |

> **Couverture à 100 % :** les seules routes sans exhibit sont de pures redirections sans UI (`demande-achat/nouvelle`, `TdrSt/page`, `evaluation_offre/access`, `evaluation_offre/[id]/evaluate`) — rien à projeter.

## Styling — fidélité garantie

- Mêmes tokens que la prod : `fieldClass` / `labelClass` copiés de `demande-achat/new` et `ouverture_offre/new`, `.input`, `.btn-primary`, `.ucp-toast` de `globals.css`, cartes `rounded-[30px]` du login.
- Tailwind v4, aucune nouvelle dépendance.

## Ordre de démo suggéré (10 min, plein écran)

1. Connexion → 2. Inscription (+ vérification e-mail) → 3. État de besoins (lignes multiples + routage TDR) → 4. Validation (cascade budgétaire) → 5. Budget → 6. Marché (catalogue + réf. bailleur) → 7. Séance (commission structurée) → 8. Validation publique (2 phases + signature) → 9. Évaluation wizard (cliquer les 6 étapes) → 10. TDR + suivi filtré → 11. Contrat (échéancier 100 %) → 12. Réception (table par ligne) / Clôture → 13. Dashboards (passations → radar → PPM admin Django).

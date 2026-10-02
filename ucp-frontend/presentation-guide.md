# Guide de présentation — `/presentation`

Page vitrine dédiée à la démonstration devant jury : `src/app/presentation/page.tsx`.
Route publique (hors `/personnel`, donc non filtrée par `src/middleware.tsx`) — aucun token, aucun groupe requis.

## Lancement

```bash
cd ucp-frontend
npm run dev
# ouvrir http://localhost:3000/presentation
```

## Structure de la page

- **Header** : badge « Mode présentation », rappel « 100% mocké ».
- **Sidebar (gauche)** : 4 groupes, 15 formulaires. Un clic = un formulaire dans la zone principale.
- **Zone principale** : le formulaire actif + bandeau vert rappelant le rôle d'origine contourné.
- **Toast** : `.ucp-toast--success` (réutilise `globals.css`) sur chaque soumission simulée.

Tous les formulaires utilisent `useState` local + `onSubmit={(e) => { e.preventDefault(); notify(...) }}`. Aucun appel `services/*`, aucun `getToken()`.

## Catalogue

### 1. Authentification
| # | Élément sidebar | Fichier réel répliqué | Champs mockés | Rôle contourné |
|---|---|---|---|---|
| 1 | Connexion | `src/app/auth/login/page.tsx` | email, password | Public |
| 2 | Inscription fournisseur | `src/app/auth/public/register/page.tsx` | full_name, email, phone, type_entité, NIF, password ×2 | Public |
| 3 | Login évaluateur DAO | `src/app/personnel/evaluation/login/page.tsx` | email + code DAO | Évaluateur isolé (token DAO) |

### 2. Demande d'achat
| # | Élément | Réel | Champs | Rôle contourné |
|---|---|---|---|---|
| 4 | État de besoins (création) | `personnel/demande-achat/new/page.tsx` | unité, type, catégorie, priorité, objet, bénéficiaire, PTBA, justification, ligne (désignation, qté, prix, lieu) | Demandeur |
| 5 | Validation | `demande-achat/components/ValidationModal.tsx` | décision, conformité technique, commentaire | Validateur hiérarchique/technique/budgétaire |
| 6 | Imputation budgétaire | `BudgetModal.tsx` | ligne budgétaire, source (GAVI, FM…) | Finance |
| 7 | Passation | `PassationModal.tsx` | mode, réf. marché, date attribution | Agent achat |
| 8 | Réception | `ReceptionModal.tsx` | date, réceptionnaire, conformité, commentaire | Logistique |
| 9 | Livraison / Clôture | `LivraisonModal.tsx` + `ClotureModal.tsx` | date, statut final, satisfaction 1–5 | Logistique |

### 3. Marchés & séances
| # | Élément | Réel | Champs | Rôle contourné |
|---|---|---|---|---|
| 10 | Publication marché | `personnel/procurement/components/procurementForm.tsx` | intitulé, procédure (AOI/AON/DC), catégorie, bailleur, dates, fichier | Agent marché |
| 11 | Séance d'ouverture | `personnel/ouverture_offre/new/page.tsx` | réf, objet, date/heure/lieu, président, membres (≥3) | Admin / Secrétaire |
| 12 | Validation publique | `personnel/ouverture_offre/validation/[id]/page.tsx` | rôle membre/président, email, password, décision | Commission sans JWT |

### 4. Évaluation & contrat
| # | Élément | Réel | Champs | Rôle contourné |
|---|---|---|---|---|
| 13 | Évaluation (4 étapes) | `evaluation_offre/components/EvaluationForm.tsx` | préliminaire (checklist), technique (slider /100), financière (montants), décision | Évaluateur assigné |
| 14 | TDR / ST | `personnel/TdrSt/formulaire/.../DocumentFormModal.tsx` | intitulé, type, procédure, période, montant USD | Demandeur |
| 15 | Contrat NOTI5 | `personnel/contractualisation/[id]/page.tsx` | e-mail prestataire, durée, clauses, échéance + montant | Secrétaire contractualisation |

## Styling — fidélité garantie

- Mêmes tokens que la prod : `fieldClass` / `labelClass` copiés de `demande-achat/new` et `ouverture_offre/new`, `.input`, `.btn-primary`, `.ucp-toast` de `globals.css`, cartes `rounded-[30px]` du login.
- Tailwind v4, aucune nouvelle dépendance.

## Ordre de démo suggéré (10 min)

1. Connexion → 2. Inscription → 3. État de besoins → 4. Validation → 5. Budget → 6. Marché → 7. Séance → 8. Validation publique → 9. Évaluation (cliquer les 4 onglets) → 10. TDR → 11. Contrat → 12. Réception/Clôture.

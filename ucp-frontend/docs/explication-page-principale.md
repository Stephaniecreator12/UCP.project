# Explication Claire de `src/app/page.tsx` (ligne par ligne)

Ce fichier est le coeur de ton front: il affiche le dashboard, charge les donnees, laisse modifier le tableau, puis sauvegarde/supprime.

## Le code de reference

Fichier: `src/app/page.tsx`

## Explication ligne par ligne

- Ligne 1: `"use client";`
Ce composant s'execute dans le navigateur (pas seulement sur le serveur Next.js).

- Ligne 3: `import React, { useState, useEffect, useCallback } from "react";`
On importe React et 3 hooks:
`useState` pour stocker des valeurs,
`useEffect` pour executer du code au chargement,
`useCallback` pour stabiliser une fonction.

- Ligne 4: `import SidebarMenu from "@/components/SidebarMenu";`
Import du menu de gauche.

- Ligne 5: `import GridTable from "@/components/GridTable";`
Import du gros tableau editable.

- Ligne 6: `import { MenuItemType, GridRow } from "@/types/grid";`
Import des types TypeScript pour securiser le code.

- Ligne 7: `import { TABLE_CONFIGS } from "@/config/tableConfigs";`
Import de la configuration des colonnes selon le menu choisi.

- Lignes 8-12: import API
`createProcurement`: creer/enregistrer une ligne vers backend.
`getAllProcurements`: charger toutes les lignes.
`Procurement`: type de donnee provenant du backend.

- Ligne 14: `export default function GestionMarches() {`
Definition du composant principal de la page.

- Ligne 15: `activeMenu`
Etat du menu actif (`works`, `goods-services`, `consultants`).
Valeur initiale: `"works"`.

- Ligne 16: `rows`
Etat contenant toutes les lignes affichees dans le tableau.

- Ligne 17: `isLoading`
Indique si on est en train de charger les donnees.

- Ligne 18: `isSaving`
Indique si on est en train d'enregistrer une ligne.

- Lignes 19-22: `saveMessage`
Petit message temporaire succes/erreur affiche en haut.
Exemple: "Ligne enregistree !" ou "Erreur suppression".

- Ligne 24: `const config = TABLE_CONFIGS[activeMenu];`
Recupere la config du menu actif:
le label et les colonnes du tableau.

- Lignes 25-26: `API_URL`
URL backend lue depuis la variable d'environnement `NEXT_PUBLIC_BACKEND_URL`.

- Ligne 28: `const loadData = useCallback(async () => {`
Fonction de chargement des donnees.
`useCallback` evite de recreer la fonction inutilement, sauf si `activeMenu` change.

- Ligne 29: `setIsLoading(true);`
Active l'etat de chargement.

- Lignes 30-31:
Appel backend pour recuperer toutes les donnees.

- Lignes 32-37:
Filtre les donnees selon le menu actuel:
`works` -> type `Travaux`
`goods-services` -> type `Biens`
`consultants` -> type `Consultance`

- Ligne 38:
Transforme chaque objet backend en ligne front avec un `_id` string.
`_id` est pratique pour l'affichage React et les operations de ligne.

- Lignes 39-40:
Si erreur au chargement, affiche un message d'erreur.

- Lignes 41-43:
Dans tous les cas, retire l'etat de chargement.

- Ligne 44: `}, [activeMenu]);`
La fonction `loadData` est recalculée quand `activeMenu` change.

- Lignes 46-48: `useEffect`
Au montage du composant (et quand `loadData` change), on lance `loadData()`.
Donc changer le menu recharge les donnees filtrees.

- Ligne 50: `handleAddRow`
Fonction pour ajouter une nouvelle ligne vide.

- Ligne 51:
Genere un id temporaire local ex: `_new_1739123...`.

- Ligne 52:
Cree la ligne vide avec `_id` et `review_status: "post"`.

- Ligne 53:
Parcourt toutes les colonnes configurees et initialise chaque champ a `""`.

- Ligne 54:
Ajoute la nouvelle ligne a la fin du tableau.

- Ligne 57: `handleRowChange`
Fonction appelee quand l'utilisateur modifie une cellule.

- Lignes 58-60:
Met a jour uniquement la bonne ligne (`row._id === rowId`) et le bon champ (`columnKey`).

- Ligne 63: `handleRowDelete`
Fonction pour supprimer une ligne.

- Ligne 64:
Demande confirmation utilisateur avant suppression.

- Lignes 66-69:
Si la ligne existe deja en base (id pas `_new_`), envoie un `DELETE` au backend.

- Ligne 70:
Supprime la ligne localement dans le state React.

- Ligne 71:
Affiche message succes.

- Lignes 72-74:
Si probleme, affiche message d'erreur.

- Ligne 78: `handleRowSave`
Fonction principale d'enregistrement d'une ligne.

- Ligne 79:
Active l'etat d'enregistrement.

- Lignes 81-85: `typeMapping`
Mappe les menus frontend vers les types backend:
`works -> Travaux`, `goods-services -> Biens`, `consultants -> Consultance`.

- Lignes 87-96: `procurementData`
Construit l'objet envoye au backend:
reprend la ligne (`...row`),
ajoute le `type`,
garantit un `title` non vide,
mappe des champs de dates du front vers les noms attendus.

- Lignes 98-100 (commentaire)
Explique l'intention create/update.
Actuellement le code appelle surtout create.

- Ligne 102:
Envoie les donnees via `createProcurement`.

- Lignes 104-107:
Si succes, remplace la ligne locale par la version retournee (avec vrai `id`) et message succes.

- Lignes 109-113:
Gestion d'erreur detaillee: log console + message lisible.

- Lignes 114-116:
Fin de sauvegarde + efface message apres 3 secondes.

- Ligne 119: `handleRowUpdate`
Met a jour une ligne complete (utile apres calcul de planning dans `GridTable`).

- Lignes 120-122:
Remplace la ligne correspondante par `updatedRow`.

- Ligne 125: `return ( ... )`
Rendu visuel de la page.

- Ligne 126: `<div className="dashboard">`
Conteneur global de la page.

- Ligne 127: `<SidebarMenu ... />`
Affiche le menu gauche.
`activeMenu` = valeur actuelle.
`onMenuSelect={setActiveMenu}` = cliquer un menu met a jour l'etat.

- Ligne 128: `<main className="dashboard-content">`
Zone principale a droite.

- Lignes 129-132:
Header avec titre dynamique (selon menu) et compteur de lignes.

- Lignes 134-136:
Si `saveMessage` existe, affiche une notification.

- Ligne 138: conteneur de tableau.

- Lignes 139-148: `<GridTable ... />`
On passe toutes les donnees et actions:
`columns`: colonnes selon le menu,
`rows`: lignes actuelles,
`onRowChange`: edition cellule,
`onRowSave`: sauvegarde ligne,
`onRowUpdate`: maj d'une ligne complete,
`onRowDelete`: suppression,
`onAddRow`: ajout,
`isLoading`: bloque/affiche chargement si chargement ou sauvegarde.

- Lignes 151-154:
Fin du JSX et fin du composant.

## Schema mental simple

1. La page charge toutes les donnees.
2. Elle filtre selon le menu choisi.
3. Elle affiche le tableau correspondant.
4. Chaque action du tableau appelle une fonction locale (`add`, `change`, `save`, `delete`).
5. Ces fonctions mettent a jour l'ecran + parlent au backend.

## Que modifier selon ton besoin

- Changer les colonnes:
`src/config/tableConfigs.ts`

- Changer la logique d'enregistrement:
`src/app/page.tsx` (fonction `handleRowSave`) + `src/services/api.ts`

- Changer la logique d'affichage/edition des cellules:
`src/components/GridTable.tsx` et `src/components/GridCell.tsx`

- Changer les styles:
`src/app/globals.css`

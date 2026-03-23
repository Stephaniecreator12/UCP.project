# API Achats

Mini documentation backend du module `achats`.

Cette doc sert a 4 choses :
- savoir quelle URL appeler depuis le front
- savoir quelle methode HTTP utiliser
- savoir quelles donnees envoyer
- savoir ce que le backend renvoie

## Base

- Prefixe API : `/api/achats/`
- Authentification : utilisateur connecte obligatoire
- App Django : `apps.achats`

## Roles metier

- `DEMANDEUR`
- `SERVICE`
- `BUDGET`
- `DIRECTION`
- `MARCHES`

## Statuts de demande

- `BROUILLON`
- `SOUMISE`
- `VALIDE_SERVICE`
- `VALIDE_BUDGET`
- `VALIDE_DIRECTION`
- `REJETEE`
- `TRANSMISE_MARCHES`

## Cycle metier

`BROUILLON -> SOUMISE -> VALIDE_SERVICE -> VALIDE_BUDGET -> VALIDE_DIRECTION -> TRANSMISE_MARCHES`

Le rejet est possible pendant les etapes de validation :

`SOUMISE / VALIDE_SERVICE / VALIDE_BUDGET -> REJETEE`

## Regle simple a retenir

- Le demandeur cree, modifie et soumet sa demande
- Les validateurs voient les dossiers a traiter selon leur role
- La validation fait avancer le statut
- Le detail d'une demande renvoie aussi l'historique workflow et les validations

---

## 1. Creer une demande

**URL**

`POST /api/achats/demandes/`

**Qui peut appeler**

- utilisateur connecte
- en pratique : le demandeur

**Body attendu**

Champs acceptes par le serializer d'ecriture :

```json
{
  "service_demandeur": "Informatique",
  "fonction_demandeur": "Chef de service",
  "activite_ptba": "Projet d'equipement",
  "indicateur_performance": "Disponibilite des equipements",
  "source_financement": "FONDS_MONDIAL",
  "ligne_budgetaire": "L1",
  "budget_estime": "1000.00",
  "devise": "USD",
  "type_marche": "BIENS",
  "nature_activite": "AUTRE",
  "objet_demande": "Acquisition ordinateurs",
  "description": "Achat de postes de travail",
  "region": "Analamanga",
  "adresse_livraison": "Siege UCP",
  "date_debut": "2026-04-01",
  "date_fin": "2026-04-30",
  "urgent": false,
  "justification_urgence": ""
}
```

**Remarques**

- `numero_demande` est genere par le backend
- `statut` n'est pas envoye par le front
- `demandeur` n'est pas envoye par le front
- si tu envoies `pieces_jointes`, il faut utiliser `multipart/form-data`

**Reponse JSON**

Le backend renvoie l'objet complet de lecture. Exemple simplifie :

```json
{
  "id": 1,
  "numero_demande": "UCP/DA/2026/0001",
  "date_demande": "2026-03-23",
  "service_demandeur": "Informatique",
  "demandeur_username": "alice",
  "objet_demande": "Acquisition ordinateurs",
  "statut": "BROUILLON",
  "statut_display": "Brouillon",
  "validations": [],
  "workflow_history": [
    {
      "action": "CREATE",
      "action_display": "Creation"
    }
  ]
}
```

**Erreurs possibles**

- `400` : donnees invalides
- `401` : utilisateur non authentifie

---

## 2. Voir mes demandes

**URL**

`GET /api/achats/demandes/me/`

**Qui peut appeler**

- utilisateur connecte
- en pratique : le demandeur

**Body attendu**

Aucun.

**Reponse JSON**

Liste de demandes :

```json
[
  {
    "id": 1,
    "numero_demande": "UCP/DA/2026/0001",
    "service_demandeur": "Informatique",
    "objet_demande": "Acquisition ordinateurs",
    "statut": "BROUILLON",
    "statut_display": "Brouillon"
  }
]
```

**Erreurs possibles**

- `401` : utilisateur non authentifie

---

## 3. Voir le detail d'une demande

**URL**

`GET /api/achats/demandes/<id>/`

Exemple :

`GET /api/achats/demandes/1/`

**Qui peut appeler**

- le demandeur proprietaire
- le validateur concerne
- un utilisateur autorise selon les regles metier

**Body attendu**

Aucun.

**Reponse JSON**

Objet complet de lecture. Exemple simplifie :

```json
{
  "id": 1,
  "numero_demande": "UCP/DA/2026/0001",
  "service_demandeur": "Informatique",
  "objet_demande": "Acquisition ordinateurs",
  "description": "Achat de postes de travail",
  "statut": "SOUMISE",
  "statut_display": "Soumise",
  "validations": [],
  "workflow_history": [
    {
      "action": "CREATE",
      "action_display": "Creation"
    },
    {
      "action": "SUBMIT",
      "action_display": "Soumission"
    }
  ]
}
```

**Erreurs possibles**

- `401` : utilisateur non authentifie
- `403` : acces interdit
- `404` : demande introuvable

---

## 4. Modifier une demande

**URL**

`PATCH /api/achats/demandes/<id>/`

Le backend accepte aussi `PUT`, mais `PATCH` est plus pratique pour le front.

**Qui peut appeler**

- uniquement le demandeur proprietaire
- uniquement si la demande est encore `BROUILLON`

**Body attendu**

Tu peux envoyer seulement les champs a modifier.

Exemple :

```json
{
  "objet_demande": "Acquisition ordinateurs portables",
  "budget_estime": "1500.00"
}
```

**Reponse JSON**

Objet complet mis a jour :

```json
{
  "id": 1,
  "numero_demande": "UCP/DA/2026/0001",
  "objet_demande": "Acquisition ordinateurs portables",
  "budget_estime": "1500.00",
  "statut": "BROUILLON",
  "statut_display": "Brouillon"
}
```

**Erreurs possibles**

- `400` : donnees invalides
- `401` : utilisateur non authentifie
- `403` : demande non modifiable
- `404` : demande introuvable

---

## 5. Soumettre une demande

**URL**

`POST /api/achats/demandes/<id>/submit/`

Exemple :

`POST /api/achats/demandes/1/submit/`

**Qui peut appeler**

- uniquement le demandeur proprietaire
- uniquement si la demande est `BROUILLON`

**Body attendu**

En pratique, aucun champ n'est necessaire.

```json
{}
```

**Reponse JSON**

Objet complet apres soumission :

```json
{
  "id": 1,
  "numero_demande": "UCP/DA/2026/0001",
  "statut": "SOUMISE",
  "statut_display": "Soumise",
  "workflow_history": [
    {
      "action": "CREATE"
    },
    {
      "action": "SUBMIT"
    }
  ]
}
```

**Erreurs possibles**

- `401` : utilisateur non authentifie
- `403` : utilisateur non autorise ou demande deja soumise
- `404` : demande introuvable

---

## 6. Lister les demandes a traiter

**URL**

`GET /api/achats/validations/pending/`

**Qui peut appeler**

- un utilisateur connecte ayant un role metier de traitement
- typiquement : `SERVICE`, `BUDGET`, `DIRECTION`, `MARCHES`

**Body attendu**

Aucun.

**Reponse JSON**

Liste des demandes a traiter pour le role courant :

```json
[
  {
    "id": 1,
    "numero_demande": "UCP/DA/2026/0001",
    "service_demandeur": "Informatique",
    "objet_demande": "Acquisition ordinateurs",
    "statut": "SOUMISE",
    "statut_display": "Soumise"
  }
]
```

**Regle metier**

- `SERVICE` voit les demandes `SOUMISE`
- `BUDGET` voit les demandes `VALIDE_SERVICE`
- `DIRECTION` voit les demandes `VALIDE_BUDGET`
- `MARCHES` voit les demandes `VALIDE_DIRECTION`

**Erreurs possibles**

- `401` : utilisateur non authentifie

---

## 7. Prendre une decision de validation

**URL**

`POST /api/achats/validations/decision/`

**Qui peut appeler**

- uniquement le validateur autorise pour l'etape courante

**Body attendu**

Cas standard :

```json
{
  "demande_id": 1,
  "decision": "APPROUVE",
  "commentaire": "Demande validee"
}
```

Cas budget :

```json
{
  "demande_id": 1,
  "decision": "APPROUVE",
  "commentaire": "Budget disponible",
  "fonds_statut": "DISPONIBLES",
  "visa": "Visa budget"
}
```

Cas rejet :

```json
{
  "demande_id": 1,
  "decision": "REJETE",
  "commentaire": "Pieces insuffisantes"
}
```

**Regles metier**

- pour une validation budget approuvee, `fonds_statut` est obligatoire
- le backend n'accepte qu'une seule validation par role et par demande

**Reponse JSON**

Le backend renvoie la demande mise a jour.

Exemple apres validation service :

```json
{
  "id": 1,
  "numero_demande": "UCP/DA/2026/0001",
  "statut": "VALIDE_SERVICE",
  "statut_display": "Validee service",
  "validations": [
    {
      "role": "SERVICE",
      "role_display": "Responsable service",
      "statut": "APPROUVE",
      "statut_display": "Approuve",
      "commentaire": "Demande validee"
    }
  ]
}
```

**Erreurs possibles**

- `400` : body invalide ou validation deja faite
- `401` : utilisateur non authentifie
- `403` : utilisateur non autorise pour cette etape
- `404` : demande introuvable

---

## 8. Transmettre aux marches

**URL**

`POST /api/achats/demandes/<id>/transmit/`

Exemple :

`POST /api/achats/demandes/1/transmit/`

**Qui peut appeler**

- `DIRECTION`
- `MARCHES`

**Condition**

La demande doit etre `VALIDE_DIRECTION`.

**Body attendu**

```json
{}
```

**Reponse JSON**

```json
{
  "id": 1,
  "numero_demande": "UCP/DA/2026/0001",
  "statut": "TRANSMISE_MARCHES",
  "statut_display": "Transmise aux marches",
  "date_transmission_marches": "2026-03-23T10:00:00Z"
}
```

**Erreurs possibles**

- `401` : utilisateur non authentifie
- `403` : transmission non autorisee
- `404` : demande introuvable

---

## 9. Champs utiles pour le front

### Champs toujours importants dans la reponse

- `id`
- `numero_demande`
- `service_demandeur`
- `objet_demande`
- `statut`
- `statut_display`
- `validations`
- `workflow_history`

### Champs affiches par le front demandeur

- `numero_demande`
- `date_demande`
- `objet_demande`
- `service_demandeur`
- `budget_estime`
- `devise`
- `statut_display`

### Champs affiches par le front validateur

- `numero_demande`
- `objet_demande`
- `service_demandeur`
- `statut_display`
- `description`
- `date_debut`
- `date_fin`
- `workflow_history`
- `validations`

---

## 10. Erreurs a montrer clairement dans le front

Le front doit gerer au minimum :

- `400` : erreur de validation formulaire
- `401` : utilisateur non connecte
- `403` : action interdite
- `404` : ressource introuvable

Exemples de messages backend utiles :

- `Ce champ est obligatoire si la demande est urgente.`
- `Seul un brouillon peut etre modifie.`
- `Cette etape a deja ete validee.`
- `Vous n'etes pas autorise a valider cette etape.`

---

## 11. Note importante pour le front

Si le front doit envoyer une piece jointe :

- ne pas envoyer du JSON pur
- utiliser `multipart/form-data`

Si le front n'envoie pas de fichier :

- le JSON classique suffit

---

## 12. Resume ultra court

Le front aura surtout besoin de ces endpoints :

- `POST /api/achats/demandes/`
- `GET /api/achats/demandes/me/`
- `GET /api/achats/demandes/<id>/`
- `PATCH /api/achats/demandes/<id>/`
- `POST /api/achats/demandes/<id>/submit/`
- `GET /api/achats/validations/pending/`
- `POST /api/achats/validations/decision/`
- `POST /api/achats/demandes/<id>/transmit/`

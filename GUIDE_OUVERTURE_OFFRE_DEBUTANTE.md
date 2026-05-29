# Guide complet du module Ouverture des offres

Ce document est fait pour etre lu hors ligne. Il explique le module `ouverture_offre` depuis zero, avec le vocabulaire de base de donnees, Merise, Django, API, React/Next.js, et la logique metier.

L'objectif n'est pas seulement de savoir "quel fichier fait quoi", mais de comprendre pourquoi on a construit le module comme ca, afin que tu puisses le manipuler toi-meme ensuite.

## 1. Idee generale du module

Dans un processus de marche public, on publie un DAO/DC, les soumissionnaires deposent leurs plis, puis apres la date limite on ouvre les offres en seance.

Le module `ouverture_offre` sert a gerer cette seance :

- le secretaire cree ou prepare la seance depuis un DAO existant ;
- il renseigne la date, l'heure, le lieu, le president, les membres presents ;
- il enregistre les offres recues ;
- il indique l'etat des scelles, les ratures, les documents de substitution ;
- il transmet la seance aux membres ;
- chaque membre valide ou rejette ;
- quand tous les membres presents ont valide, le president valide ou rejette ;
- si le president valide, le systeme genere et archive un PV PDF.

En langage simple : on transforme une procedure papier en workflow numerique avec trace, roles et validation.

## 2. Les grands blocs techniques

Le module est partage entre backend et frontend.

Backend Django :

- `backend_PPM/apps/ouverture_offre/models/` : les tables de base de donnees.
- `backend_PPM/apps/ouverture_offre/serializers/` : transformation entre objets Django et JSON.
- `backend_PPM/apps/ouverture_offre/services/` : logique metier.
- `backend_PPM/apps/ouverture_offre/views/` : endpoints API.
- `backend_PPM/apps/ouverture_offre/urls.py` : routes API.
- `backend_PPM/apps/ouverture_offre/permissions.py` : controle d'acces.

Frontend Next.js :

- `ucp-frontend/src/app/ouverture_offre/page.tsx` : tableau de bord.
- `ucp-frontend/src/app/ouverture_offre/[id]/page.tsx` : page detail d'une seance.
- `ucp-frontend/src/app/ouverture_offre/components/SeanceOuvertureDetail.tsx` : grand formulaire et validation.
- `ucp-frontend/src/app/ouverture_offre/components/SeanceOverviewDetails.tsx` : affichage detaille en lecture.
- `ucp-frontend/src/app/ouverture_offre/components/SeanceOverviewModal.tsx` : modale de consultation.
- `ucp-frontend/src/services/ouvertureOffre.ts` : fonctions `fetch` vers l'API.
- `ucp-frontend/src/types/ouvertureOffre.ts` : types TypeScript des donnees.

Le chemin complet d'une action ressemble a ceci :

```txt
Utilisateur clique dans le frontend
        |
        v
Service TypeScript fait un fetch vers /api/ouverture/...
        |
        v
Proxy Next.js transmet vers Django
        |
        v
URL Django choisit une view
        |
        v
View DRF verifie auth, lit request.data, appelle serializer/service
        |
        v
Service modifie les modeles Django
        |
        v
ORM Django ecrit dans PostgreSQL
        |
        v
Serializer retourne du JSON
        |
        v
Frontend met a jour l'affichage
```

## 3. Vocabulaire indispensable

### Modele

Un modele Django est une classe Python qui represente une table SQL. Exemple :

```py
class SeanceOuverture(models.Model):
    reference_dossier = models.CharField(max_length=100)
```

Django comprend que cela veut dire : cree une table avec une colonne `reference_dossier`.

### Table

Une table est un ensemble de lignes. Dans ce module, on a par exemple une table des seances, une table des membres, une table des offres, une table des PV.

### Ligne

Une ligne est un enregistrement. Une seance precise est une ligne dans la table `SeanceOuverture`.

### Cle primaire

Chaque modele Django recoit automatiquement un champ `id`. C'est l'identifiant unique de la ligne.

### Cle etrangere

Une `ForeignKey` relie une table a une autre. Exemple :

```py
seance = models.ForeignKey(SeanceOuverture, on_delete=models.CASCADE)
```

Cela veut dire : ce membre appartient a une seance.

### Serializer

Le serializer transforme :

- un objet Django en JSON pour le frontend ;
- un JSON venant du frontend en donnees validees pour Django.

Sans serializer, le frontend et le backend ne parleraient pas proprement la meme langue.

### View API

Une view recoit la requete HTTP :

- `GET` pour lire ;
- `POST` pour creer ou executer une action ;
- `PATCH` pour modifier partiellement.

### Service

Un service contient la logique metier. Exemple : "si tous les membres ont valide, alors passer la seance en validation president".

C'est important de separer les services des views. La view doit rester simple, le service contient les regles.

## 4. Les tables du module

Le module a quatre tables principales :

```txt
SeanceOuverture
MembreSeance
OffreOuverture
PVDocument
```

### 4.1 Table SeanceOuverture

Fichier :

`backend_PPM/apps/ouverture_offre/models/seance_ouverture.py`

Cette table est le coeur du module. Elle represente une seance d'ouverture.

Champs importants :

| Champ | Type Django | Sens |
|---|---|---|
| `reference_dossier` | `CharField` | Reference du DAO/DC |
| `objet_dossier` | `CharField` | Objet du marche |
| `date_seance` | `DateField` | Date d'ouverture |
| `heure_seance` | `TimeField` | Heure d'ouverture |
| `lieu` | `CharField` | Lieu de la seance |
| `observations` | `TextField` | Observations generales |
| `secretaire` | `ForeignKey(User)` | Utilisateur qui prepare la seance |
| `president` | `ForeignKey(User)` | President de seance |
| `statut` | `CharField choices` | Etat du workflow |
| `created_at` | `DateTimeField` | Date de creation |
| `updated_at` | `DateTimeField` | Date de derniere modification |
| `president_a_valide` | `BooleanField` | Le president a-t-il valide ? |
| `president_decision` | `CharField choices` | Decision president |
| `president_commentaire` | `TextField` | Commentaire president |
| `date_validation_president` | `DateTimeField` | Date de validation president |
| `president_ip_adresse` | `GenericIPAddressField` | Trace IP |
| `president_navigateur` | `CharField` | Trace navigateur |
| `etape_ouverture` | `CharField choices` | Complete ou admin/tech |
| `etat_scelle` | `CharField choices` | Intact, altere, absent |
| `presence_rature` | `BooleanField` | Rature constatee ? |
| `description_rature` | `TextField` | Detail de la rature |
| `document_substitution_present` | `BooleanField` | Document de substitution present ? |

### Pourquoi mettre le statut dans la seance ?

Le statut dit ou on se trouve dans le workflow :

```py
BROUILLON
EN_SAISIE
EN_VALIDATION_MEMBRES
EN_VALIDATION_PRESIDENT
VALIDEE
REJETEE
ARCHIVEE
```

C'est comme un feu de circulation :

- `BROUILLON` : on peut encore modifier ;
- `EN_SAISIE` : preparation en cours ;
- `EN_VALIDATION_MEMBRES` : les membres doivent valider ;
- `EN_VALIDATION_PRESIDENT` : le president doit valider ;
- `VALIDEE` : seance terminee ;
- `REJETEE` : quelqu'un a refuse ;
- `ARCHIVEE` : conservee en archive.

Le statut est aussi indexe avec `db_index=True`. Cela aide la base a chercher plus vite par statut.

### Pourquoi `on_delete=models.PROTECT` pour secretaire et president ?

Pour le secretaire et le president, on utilise :

```py
on_delete=models.PROTECT
```

Cela veut dire : on interdit de supprimer un utilisateur s'il est lie a une seance.

Pourquoi ? Parce qu'une seance officielle ne doit pas perdre l'identite de son secretaire ou de son president. C'est une question de tracabilite.

### 4.2 Table MembreSeance

Fichier :

`backend_PPM/apps/ouverture_offre/models/membre_seance.py`

Cette table represente les membres presents dans une seance.

Champs :

| Champ | Sens |
|---|---|
| `seance` | La seance concernee |
| `utilisateur` | Le user membre |
| `est_present` | Present ou absent |
| `a_valide` | Ancien booleen de validation |
| `decision` | `EN_ATTENTE`, `VALIDEE`, `REJETEE` |
| `commentaire` | Commentaire du membre |
| `date_validation` | Date de sa decision |
| `ip_adresse` | Trace IP |
| `navigateur` | Trace navigateur |

Relation Merise :

```txt
SEANCE 1,n ---- contient ---- 1,1 MEMBRE_SEANCE
USER   1,n ---- participe ---- 1,1 MEMBRE_SEANCE
```

Cela signifie :

- une seance peut avoir plusieurs membres ;
- un membre de seance appartient a une seule seance ;
- un utilisateur peut participer a plusieurs seances ;
- une participation concerne un seul utilisateur.

Contrainte importante :

```py
models.UniqueConstraint(
    fields=["seance", "utilisateur"],
    name="unique_membre_par_seance",
)
```

Cela interdit d'ajouter deux fois le meme utilisateur dans la meme seance.

### Pourquoi avoir une table MembreSeance au lieu d'un simple champ liste ?

Parce qu'un membre n'est pas seulement un nom. Il a aussi :

- une presence ;
- une decision ;
- un commentaire ;
- une date de validation ;
- une adresse IP ;
- un navigateur.

Donc il faut une vraie table associative avec ses propres attributs. C'est exactement une idee Merise : quand une association porte des informations, elle devient souvent une table.

### 4.3 Table OffreOuverture

Fichier :

`backend_PPM/apps/ouverture_offre/models/offre_ouverture.py`

Cette table represente une offre ou un pli pendant la seance.

Champs :

| Champ | Sens |
|---|---|
| `seance` | Seance liee |
| `ordre_passage` | Numero de ligne |
| `nom_soumissionnaire` | Nom du soumissionnaire |
| `pli_existe` | Le pli a-t-il ete recu ? |
| `motif_absence_pli` | Pourquoi le pli manque |
| `date_reception_pli` | Date de reception |
| `heure_reception_pli` | Heure de reception |
| `enveloppe_administrative` | Deposee/manquante |
| `enveloppe_technique` | Deposee/manquante |
| `enveloppe_financiere` | Deposee/manquante |
| `montant_global` | Montant propose |
| `observations` | Commentaire |

Relation :

```txt
SEANCE 1,n ---- contient ---- 1,1 OFFRE_OUVERTURE
```

Une seance peut avoir zero, une ou plusieurs offres.

Pourquoi `DecimalField` pour le montant ?

```py
models.DecimalField(max_digits=18, decimal_places=2)
```

Pour l'argent, on evite `FloatField`, car les flottants peuvent creer des erreurs de precision. `DecimalField` est plus adapte aux montants.

### 4.4 Table PVDocument

Fichier :

`backend_PPM/apps/ouverture_offre/models/pv_document.py`

Cette table stocke le PV PDF genere.

Champs :

| Champ | Sens |
|---|---|
| `seance` | Seance liee |
| `fichier` | Fichier PDF |
| `version` | Numero de version |
| `hash_document` | Empreinte SHA256 |
| `created_at` | Date de creation |

Relation :

```txt
SEANCE 1,1 ---- possede ---- 0,1 PV_DOCUMENT
```

Dans le code, c'est un `OneToOneField`, donc une seance a au maximum un document PV actif.

Pourquoi un hash SHA256 ?

Le hash est une empreinte du fichier. Si le PDF change, son hash change. C'est utile pour l'integrite.

## 5. Schema logique simplifie

Voici une vue relationnelle simple :

```txt
auth_user
  id PK
  username
  email
  ...

ouverture_offre_seanceouverture
  id PK
  reference_dossier
  objet_dossier
  date_seance
  heure_seance
  lieu
  statut
  secretaire_id FK -> auth_user.id
  president_id FK -> auth_user.id
  ...

ouverture_offre_membreseance
  id PK
  seance_id FK -> ouverture_offre_seanceouverture.id
  utilisateur_id FK -> auth_user.id
  est_present
  decision
  commentaire
  ...
  UNIQUE(seance_id, utilisateur_id)

ouverture_offre_offreouverture
  id PK
  seance_id FK -> ouverture_offre_seanceouverture.id
  ordre_passage
  nom_soumissionnaire
  pli_existe
  montant_global
  ...

ouverture_offre_pvdocument
  id PK
  seance_id UNIQUE FK -> ouverture_offre_seanceouverture.id
  fichier
  version
  hash_document
```

## 6. Les migrations

Dossier :

`backend_PPM/apps/ouverture_offre/migrations/`

Les migrations sont l'historique des changements de base de donnees.

Exemples :

- `0001_initial.py` : creation de `SeanceOuverture` et `MembreSeance`.
- `0003...` : ajout des champs scelle, rature, etape d'ouverture.
- `0004_offreouverture.py` : ajout de la table des offres.
- `0005...` : ajout des decisions de validation.
- `0006...` : separation des statuts membres/president.
- `0007...` : ajout IP, navigateur, PVDocument.

Secret de dev :

Quand tu modifies un modele Django, tu dois creer une migration :

```bash
python manage.py makemigrations
python manage.py migrate
```

`makemigrations` cree le plan. `migrate` applique le plan dans la base.

## 7. Les serializers

Fichier :

`backend_PPM/apps/ouverture_offre/serializers/seance_serializer.py`

Les serializers disent au backend :

- quels champs exposer au frontend ;
- quels champs accepter en entree ;
- quelles validations appliquer.

### 7.1 SimpleUserSerializer

Fichier :

`backend_PPM/apps/ouverture_offre/serializers/user_serializer.py`

Il expose une version simple d'un utilisateur :

```py
fields = ["id", "username", "first_name", "last_name", "full_name", "email"]
```

On ne renvoie pas le mot de passe, les permissions internes, etc. C'est une bonne pratique.

### 7.2 MembreSeanceSerializer

Il expose :

- `utilisateur` : l'id ;
- `utilisateur_detail` : nom, email, username ;
- la presence ;
- la decision ;
- le commentaire ;
- les traces de validation.

Certains champs sont en lecture seule :

```py
read_only_fields = ["a_valide", "decision", "date_validation", "ip_adresse", "navigateur"]
```

Pourquoi ? Parce que le frontend ne doit pas pouvoir envoyer directement :

```json
{ "decision": "VALIDEE" }
```

La validation doit passer par l'action officielle `valider-membre`, avec mot de passe, IP et navigateur.

### 7.3 OffreOuvertureSerializer

Il decrit une ligne d'offre :

- nom soumissionnaire ;
- pli existe ou pas ;
- enveloppes ;
- montant ;
- observations.

### 7.4 SeanceOuvertureSerializer

C'est le serializer principal. Il contient tout :

```py
secretaire_detail = SimpleUserSerializer(...)
president_detail = SimpleUserSerializer(...)
membres = MembreSeanceSerializer(many=True, read_only=True)
membre_ids = serializers.ListField(..., write_only=True)
offres = OffreOuvertureSerializer(many=True, required=False)
pv_document = PVDocumentSerializer(read_only=True)
```

Il y a une idee tres importante :

- `membres` sert a lire les membres complets ;
- `membre_ids` sert a envoyer seulement les ids quand on modifie la commission.

Le frontend envoie :

```json
{
  "membre_ids": [3, 7, 9]
}
```

Le backend repond :

```json
{
  "membres": [
    {
      "utilisateur": 3,
      "utilisateur_detail": {
        "full_name": "..."
      },
      "decision": "EN_ATTENTE"
    }
  ]
}
```

### 7.5 Validation des membres

La methode `validate_membre_ids` :

- supprime les doublons ;
- refuse si un membre apparait deux fois ;
- verifie que tous les ids correspondent a des utilisateurs actifs.

Pourquoi faire ca cote backend alors que le frontend le fait deja ?

Parce que le frontend peut etre contourne. Un utilisateur technique peut appeler l'API directement. Le backend doit toujours rester la source de verite.

### 7.6 Validation globale de la seance

La methode `validate` impose des regles quand le statut n'est plus brouillon :

- president obligatoire ;
- date obligatoire ;
- heure obligatoire ;
- lieu obligatoire ;
- au moins 3 membres ;
- etat du scelle obligatoire ;
- description obligatoire si rature presente ;
- nom obligatoire pour chaque offre ;
- motif obligatoire si le pli n'existe pas.

C'est la securite metier.

### 7.7 Validation par mot de passe

Les serializers :

- `ValidationMembreSerializer`
- `ValidationPresidentSerializer`
- `RejetSeanceSerializer`

demandent un `password`.

Ils verifient :

```py
request.user.check_password(value)
```

Cela oblige l'utilisateur connecte a confirmer son identite avant une decision importante.

## 8. Les services : le cerveau metier

Fichier :

`backend_PPM/apps/ouverture_offre/services/seance_service.py`

Les services sont les fonctions qui appliquent les regles du workflow.

### 8.1 list_visible_seances

```py
def list_visible_seances(user):
    return (
        SeanceOuverture.objects.select_related("secretaire", "president")
        .prefetch_related("membres__utilisateur")
        .distinct()
        .order_by("-created_at")
    )
```

Cette fonction liste les seances.

`select_related` optimise les relations simples comme secretaire et president.

`prefetch_related` optimise les relations multiples comme membres.

Secret de dev :

Sans ces optimisations, Django pourrait faire beaucoup trop de requetes SQL. C'est le probleme N+1.

### 8.2 create_seance

```py
@transaction.atomic
def create_seance(validated_data, user):
    offres_data = validated_data.pop("offres", [])
    membre_ids = validated_data.pop("membre_ids", [])
    seance = SeanceOuverture.objects.create(secretaire=user, **validated_data)
    replace_members(seance, membre_ids)
    replace_offres(seance, offres_data)
    return seance
```

Cette fonction :

1. recupere les offres du JSON ;
2. recupere les ids membres du JSON ;
3. cree la seance ;
4. cree les membres ;
5. cree les offres.

`@transaction.atomic` veut dire : soit tout reussit, soit tout est annule.

Exemple : si la seance est creee mais que les offres plantent, on ne veut pas garder une seance incomplete en base.

### 8.3 update_seance

Cette fonction modifie une seance.

Elle verifie :

- seul le secretaire de cette seance peut modifier ;
- seulement si la seance est `BROUILLON` ou `EN_SAISIE` ;
- si on passe en validation membres, il faut au moins 3 membres et un president ;
- quand on passe en `EN_VALIDATION_MEMBRES`, on envoie les notifications.

Important :

```py
previous_status = seance.statut
```

On garde l'ancien statut pour detecter un vrai changement.

Pourquoi ? Pour ne pas renvoyer des emails a chaque petite modification si la seance etait deja en validation.

### 8.4 replace_members

```py
MembreSeance.objects.filter(seance=seance).delete()
MembreSeance.objects.bulk_create(...)
```

Le code supprime les anciens membres et recree la liste.

Pourquoi faire simple comme ca ?

Parce que pendant la preparation, la liste est editable. Supprimer puis recreer evite une logique complexe de comparaison.

Attention : cela ne doit se faire que tant que la seance est modifiable. Une fois transmise, on bloque les modifications, donc on ne perd pas les validations.

### 8.5 validate_member

Cette fonction valide la seance par un membre.

Regles :

- la seance doit etre en `EN_VALIDATION_MEMBRES` ;
- l'utilisateur doit etre un membre de la seance ;
- il doit etre present ;
- il ne doit pas avoir deja traite la seance ;
- on enregistre decision, commentaire, date, IP, navigateur ;
- si tous les membres presents ont valide, on passe en `EN_VALIDATION_PRESIDENT`.

La condition importante :

```py
if not seance.membres.filter(est_present=True).exclude(
    decision=MembreSeance.Decision.VALIDEE
).exists():
```

Traduction :

"S'il n'existe aucun membre present qui n'est pas valide, alors tout le monde a valide."

Donc on passe a l'etape president.

### 8.6 reject_member

Si un membre rejette :

- sa decision devient `REJETEE` ;
- la seance devient `REJETEE` ;
- le president reste en attente.

Pourquoi la seance est rejetee directement ?

Parce que si un membre de commission refuse la saisie, le PV ne doit pas continuer vers la validation finale comme si tout etait conforme.

### 8.7 validate_president

Regles :

- la seance doit etre en `EN_VALIDATION_PRESIDENT` ;
- l'utilisateur doit etre le president ;
- le president ne doit pas avoir deja traite ;
- tous les membres presents doivent deja avoir valide ;
- on enregistre validation, commentaire, date, IP, navigateur ;
- la seance devient `VALIDEE` ;
- le PV PDF est genere.

Ligne importante :

```py
generate_and_archive_pv(seance)
```

C'est ce qui declenche la creation du PDF officiel.

### 8.8 reject_president

Si le president rejette :

- `president_decision = REJETEE` ;
- le commentaire est enregistre ;
- la seance devient `REJETEE`.

## 9. Les notifications email

Fichier :

`backend_PPM/apps/ouverture_offre/services/notification_service.py`

Ce service envoie des emails quand une validation est demandee.

Fonctions importantes :

- `notify_members_validation_requested(seance)` : notifie les membres presents.
- `notify_president_validation_requested(seance)` : notifie le president.

La fonction construit un lien :

```py
_frontend_url(f"/ouverture_offre/{seance.id}")
```

Donc l'email amene directement vers la page de validation.

`transaction.on_commit(runner)` est important. Cela veut dire :

"Envoie l'email seulement apres que la transaction base de donnees est vraiment terminee."

Pourquoi ? Pour eviter d'envoyer un email vers une seance qui n'aurait finalement pas ete sauvegardee.

## 10. Generation du PV PDF

Fichier :

`backend_PPM/apps/ouverture_offre/services/pdf_service.py`

Le service utilise `reportlab` pour fabriquer un PDF.

Il met dans le PV :

- titre ;
- date de generation ;
- reference et objet du marche ;
- date, heure, lieu ;
- secretaire ;
- president ;
- membres presents ;
- offres recues ;
- etat des scelles ;
- ratures ;
- observations ;
- historique de validation ;
- IP et navigateur ;
- hash SHA256.

Processus :

```txt
1. Creer un buffer memoire
2. Construire le contenu PDF
3. Generer les bytes du PDF
4. Calculer le hash SHA256
5. Creer ou mettre a jour PVDocument
6. Sauvegarder le fichier
```

Pourquoi un `BytesIO` ?

Parce qu'on genere le PDF en memoire avant de l'enregistrer. C'est plus pratique que de creer un fichier temporaire manuellement.

Pourquoi `get_or_create(seance=seance)` ?

Parce qu'une seance a un seul PV actif. Si le PV existe deja, on augmente la version.

## 11. Les permissions

Fichier :

`backend_PPM/apps/ouverture_offre/permissions.py`

La classe :

```py
class IsSecretaireOuLectureSeule(BasePermission)
```

dit :

- en lecture (`GET`, `HEAD`, `OPTIONS`) : tout utilisateur connecte peut lire ;
- en ecriture (`POST`, `PATCH`) : il faut etre dans le groupe `SECRETAIRE`.

Groupe attendu :

```py
SECRETAIRE_GROUP = "SECRETAIRE"
```

Cela permet au backend de proteger les actions sensibles.

## 12. Les views API

Fichier :

`backend_PPM/apps/ouverture_offre/views/seance_view.py`

Une view API recoit une requete HTTP et renvoie une reponse.

### 12.1 Liste et creation

Route :

```txt
GET  /api/ouverture/seances/
POST /api/ouverture/seances/
```

View :

```py
seance_list_create
```

En `GET` :

- on liste les seances ;
- on serialize en JSON ;
- on retourne au frontend.

En `POST` :

- on valide le JSON avec `SeanceOuvertureSerializer` ;
- on appelle `create_seance` ;
- on retourne la seance creee avec HTTP 201.

### 12.2 Detail et modification

Route :

```txt
GET   /api/ouverture/seances/<id>/
PATCH /api/ouverture/seances/<id>/
```

View :

```py
seance_detail
```

En `GET`, elle renvoie une seance.

En `PATCH`, elle modifie partiellement la seance.

### 12.3 Validation membre

Route :

```txt
POST /api/ouverture/seances/<id>/valider-membre/
```

Payload attendu :

```json
{
  "commentaire": "Tout est conforme",
  "password": "motdepasse"
}
```

La view :

- charge la seance ;
- verifie le mot de passe via serializer ;
- recupere IP et navigateur ;
- appelle `validate_member` ;
- retourne la seance mise a jour.

### 12.4 Rejet membre

Route :

```txt
POST /api/ouverture/seances/<id>/rejeter-membre/
```

Le commentaire est obligatoire.

### 12.5 Validation president

Route :

```txt
POST /api/ouverture/seances/<id>/valider-president/
```

Apres validation president, le backend genere le PV.

### 12.6 Rejet president

Route :

```txt
POST /api/ouverture/seances/<id>/rejeter-president/
```

### 12.7 Telechargement PV

Route :

```txt
GET /api/ouverture/seances/<id>/telecharger-pv/
```

La view :

- cherche le `pv_document` ;
- si absent mais seance validee/archivee, elle essaie de le regenerer ;
- renvoie un `FileResponse` PDF.

## 13. Les urls backend

Fichier :

`backend_PPM/apps/ouverture_offre/urls.py`

Routes declarees :

```py
path("utilisateurs/", available_users)
path("seances/", seance_list_create)
path("seances/<int:pk>/", seance_detail)
path("seances/<int:pk>/valider-membre/", seance_validate_member)
path("seances/<int:pk>/rejeter-membre/", seance_reject_member)
path("seances/<int:pk>/valider-president/", seance_validate_president)
path("seances/<int:pk>/rejeter-president/", seance_reject_president)
path("seances/<int:pk>/telecharger-pv/", download_pv)
```

Dans le fichier global :

`backend_PPM/config/urls.py`

on a :

```py
path("api/ouverture/", include("apps.ouverture_offre.urls"))
```

Donc :

```txt
api/ouverture/ + seances/ = /api/ouverture/seances/
```

## 14. Le proxy frontend vers backend

Fichier :

`ucp-frontend/src/app/api/[...path]/route.ts`

Le frontend appelle par exemple :

```ts
fetch("/api/ouverture/seances/")
```

Mais le backend Django tourne probablement sur :

```txt
http://127.0.0.1:8000
```

Le proxy Next.js prend la requete frontend et la renvoie vers Django.

Pourquoi utiliser un proxy ?

- le navigateur parle au meme domaine que Next ;
- on evite certains problemes CORS ;
- on garde le code frontend simple ;
- on peut configurer le backend avec `BACKEND_URL`.

Le proxy ajoute aussi un `/` final si besoin pour eviter les problemes avec `APPEND_SLASH` de Django.

## 15. Les services frontend

Fichier :

`ucp-frontend/src/services/ouvertureOffre.ts`

Ce fichier contient les fonctions qui appellent l'API.

### 15.1 getAuthHeaders

```ts
const getAuthHeaders = () => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
```

Cette fonction ajoute le token JWT dans les headers.

Sans token, le backend repondra souvent `401 Unauthorized`.

### 15.2 getSeances

```ts
fetch("/api/ouverture/seances/", { method: "GET" })
```

Recupere toutes les seances visibles.

### 15.3 getSeanceById

```ts
fetch(`/api/ouverture/seances/${id}/`)
```

Recupere une seance precise.

### 15.4 createSeance

```ts
fetch("/api/ouverture/seances/", {
  method: "POST",
  body: JSON.stringify(payload),
})
```

Cree une seance.

Dans le dashboard, quand le secretaire clique sur "Ouvrir seance", le frontend envoie :

```json
{
  "reference_dossier": "...",
  "objet_dossier": "...",
  "statut": "BROUILLON"
}
```

### 15.5 updateSeance

```ts
fetch(`/api/ouverture/seances/${id}/`, {
  method: "PATCH",
  body: JSON.stringify(payload),
})
```

Modifie la seance : president, membres, offres, statut, etc.

### 15.6 validateMember, rejectMember, validatePresident, rejectPresident

Ces fonctions appellent les routes d'action :

```txt
/valider-membre/
/rejeter-membre/
/valider-president/
/rejeter-president/
```

Elles envoient un commentaire et un mot de passe.

### 15.7 downloadPV

Cette fonction :

1. appelle l'API de telechargement ;
2. recupere un `blob` ;
3. cree une URL temporaire ;
4. cree un lien `<a>` ;
5. clique dessus automatiquement ;
6. telecharge le PDF.

## 16. Les types TypeScript

Fichier :

`ucp-frontend/src/types/ouvertureOffre.ts`

Les types TypeScript sont comme un contrat cote frontend.

Exemple :

```ts
export type SeanceOuverture = {
  id: number;
  reference_dossier: string;
  statut: SeanceStatut;
  membres: MembreSeance[];
  offres: OffreOuverture[];
  pv_document: PVDocument | null;
};
```

Pourquoi c'est utile ?

- l'editeur peut detecter les erreurs ;
- on sait quels champs existent ;
- on evite d'ecrire `seance.president_name` si ce champ n'existe pas ;
- le code devient plus lisible.

Attention : les types TypeScript ne protegent pas la base. Ils aident seulement pendant le developpement frontend.

La vraie validation reste dans Django.

## 17. Tableau de bord ouverture

Fichier :

`ucp-frontend/src/app/ouverture_offre/page.tsx`

C'est la page principale du module.

Elle fait trois chargements au demarrage :

```ts
const user = await fetchCurrentUser();
const [marketData, seanceData] = await Promise.all([
  listMarkets(),
  getSeances(),
]);
```

Elle recupere :

- l'utilisateur connecte ;
- les marches DAO/DC ;
- les seances d'ouverture.

### 17.1 Pourquoi lier marche et seance par reference ?

Le code fait :

```ts
seances.find((item) => item.reference_dossier === market.reference_number)
```

Cela veut dire :

- un DAO vient du module procurement ;
- une seance vient du module ouverture ;
- on les relie par la reference du dossier.

Si un DAO n'a pas encore de seance, le bouton "Ouvrir seance" peut creer une seance brouillon.

### 17.2 Etats frontend

Le frontend transforme le statut backend en etat d'affichage :

```ts
type OpeningState =
  | "DRAFT"
  | "ONGOING"
  | "READY"
  | "VALIDATION_MEMBERS"
  | "VALIDATION_PRESIDENT"
  | "VALIDATED"
  | "REJECTED"
  | "ARCHIVED"
  | "CANCELLED";
```

Le backend parle en francais metier technique :

```txt
BROUILLON, EN_VALIDATION_MEMBRES, VALIDEE...
```

Le frontend parle en etats d'interface :

```txt
DRAFT, READY, VALIDATED...
```

La fonction qui convertit :

```ts
getOpeningState(market, seance)
```

### 17.3 READY

Un dossier est `READY` si :

- il n'a pas encore de seance ;
- le marche est `CLOSED` ou la date limite est atteinte.

Donc le secretaire peut ouvrir la seance.

### 17.4 ONGOING

Le depot est encore en cours. On ne doit pas ouvrir les plis avant la date limite.

### 17.5 DRAFT

Une seance existe mais elle est encore modifiable.

### 17.6 VALIDATION_MEMBERS

La seance attend les membres.

### 17.7 VALIDATION_PRESIDENT

Tous les membres presents ont valide. Le president peut decider.

### 17.8 VALIDATED

La seance est validee, le PV peut etre telecharge.

### 17.9 REJECTED

La seance a ete rejetee.

## 18. Page detail de seance

Fichier :

`ucp-frontend/src/app/ouverture_offre/[id]/page.tsx`

Ce fichier est tres petit :

```tsx
import SeanceOuvertureDetail from "@/app/ouverture_offre/components/SeanceOuvertureDetail";

export default function SeanceOuvertureDetailPage() {
  return <SeanceOuvertureDetail />;
}
```

Pourquoi ?

Parce que la logique est dans le composant `SeanceOuvertureDetail`.

Next.js utilise `[id]` pour dire : cette route est dynamique.

Exemple :

```txt
/ouverture_offre/5
```

Ici `id = 5`.

## 19. Le composant SeanceOuvertureDetail

Fichier :

`ucp-frontend/src/app/ouverture_offre/components/SeanceOuvertureDetail.tsx`

C'est le plus gros fichier frontend du module.

Il gere :

- chargement d'une seance ;
- chargement des utilisateurs ;
- chargement du DAO lie ;
- formulaire editable pour le secretaire ;
- validation membre ;
- validation president ;
- rejet ;
- telechargement du PV ;
- affichage lecture seule si la seance est verrouillee.

### 19.1 Chargement initial

Au debut :

```ts
const seanceId = Number(normalizedId);
const user = await fetchCurrentUser();
const [seanceData, users, markets] = await Promise.all([
  getSeanceById(seanceId),
  getAvailableUsers(),
  listMarkets(),
]);
```

Le composant recupere :

- l'utilisateur connecte ;
- la seance ;
- la liste des utilisateurs actifs ;
- les marches pour retrouver le DAO lie.

### 19.2 Etat local du formulaire

Le type `DetailFormState` contient tout ce que le formulaire manipule :

```ts
type DetailFormState = {
  reference_dossier: string;
  objet_dossier: string;
  president: string;
  date_seance: string;
  heure_seance: string;
  lieu: string;
  membre_ids: number[];
  offres: EditableOffre[];
  ...
};
```

Pourquoi ne pas modifier directement `seance` ?

Parce que l'utilisateur peut taper dans le formulaire sans avoir encore sauvegarde. `formData` est une copie editable. La base n'est modifiee que quand on clique sur enregistrer/transmettre.

### 19.3 buildFormState

Cette fonction transforme la seance venant du backend en formulaire.

Exemple :

- `seance.membres` devient `membre_ids`;
- `seance.offres` devient des `EditableOffre`;
- si aucune offre n'existe, on cree une ligne vide.

### 19.4 canEdit

```ts
const canEdit =
  !!seance &&
  !!currentUser &&
  isSecretaireUser(currentUser) &&
  seance.secretaire === currentUser.id &&
  !isLocked;
```

Traduction :

L'utilisateur peut modifier si :

- il y a une seance ;
- il est connecte ;
- il est secretaire ;
- il est le secretaire de cette seance ;
- la seance n'est pas verrouillee.

### 19.5 isLocked

```ts
const isLocked =
  !!seance && seance.statut !== "BROUILLON" && seance.statut !== "EN_SAISIE";
```

Une fois transmise en validation, on ne modifie plus la saisie.

Pourquoi ? Pour garantir que les membres valident exactement le contenu qu'ils voient.

### 19.6 buildPayload

Cette fonction construit le JSON envoye au backend.

Elle nettoie les donnees :

- `trim()` pour enlever les espaces inutiles ;
- supprime le president de la liste des membres ;
- convertit montant vide en `null` ;
- vide les champs enveloppe/montant si le pli n'existe pas ;
- filtre les lignes d'offre totalement vides.

Secret de dev :

Le frontend prepare les donnees pour aider l'utilisateur, mais le backend doit quand meme revalider.

### 19.7 getFirstValidationIssue

Cette fonction verifie le formulaire avant d'envoyer :

- president obligatoire ;
- date obligatoire ;
- heure obligatoire ;
- lieu obligatoire ;
- au moins 3 membres ;
- scelle obligatoire ;
- description obligatoire si rature ;
- date d'ouverture apres deadline ;
- reception d'un pli avant ou egale a la deadline ;
- nom soumissionnaire obligatoire si ligne partielle ;
- motif obligatoire si pli absent.

Cela donne une meilleure experience utilisateur, car on peut surligner directement le champ incorrect.

### 19.8 handleSave

Quand le secretaire sauvegarde :

```ts
await updateSeance(seance.id, buildPayload(formData, nextStatus));
router.replace("/ouverture_offre");
```

Si `nextStatus` vaut `EN_VALIDATION_MEMBRES`, la seance part en validation membres.

### 19.9 Validation membre

Le membre clique pour valider, entre son mot de passe, puis :

```ts
await validateMember(seance.id, {
  commentaire: validationComment.trim(),
  password,
});
```

Le backend verifie le mot de passe et enregistre la decision.

### 19.10 Rejet membre

Le commentaire est obligatoire avant rejet.

Puis :

```ts
await rejectMember(seance.id, {
  commentaire: validationComment.trim(),
  password,
});
```

### 19.11 Validation president

Le president ne peut valider que si tous les membres presents ont valide.

Condition :

```ts
const allPresentMembersValidated =
  presentMembers.length > 0 &&
  presentMembers.every((membre) => membre.decision === "VALIDEE");
```

Puis :

```ts
await validatePresident(seance.id, {
  commentaire: validationComment.trim(),
  password,
});
```

Le backend genere le PV.

## 20. SeanceOverviewDetails

Fichier :

`ucp-frontend/src/app/ouverture_offre/components/SeanceOverviewDetails.tsx`

Ce composant affiche une seance en lecture :

- date ;
- heure ;
- lieu ;
- etape d'ouverture ;
- secretaire ;
- president ;
- scelle ;
- progression validations ;
- commission ;
- commentaires ;
- tableau des offres.

Il ne modifie rien. Il sert a consulter proprement.

Pourquoi separer ce composant ?

Parce qu'on l'utilise dans plusieurs endroits :

- page detail quand la seance n'est pas editable ;
- modale de consultation ;
- affichage global.

Cette separation evite de dupliquer l'interface.

## 21. SeanceOverviewModal

Fichier :

`ucp-frontend/src/app/ouverture_offre/components/SeanceOverviewModal.tsx`

C'est une fenetre modale.

Elle peut afficher :

- une seance existante avec `SeanceOverviewDetails` ;
- un DAO sans seance avec `MarketOverviewDetails`.

Elle gere aussi :

- fermeture avec `Escape` ;
- blocage du scroll du body quand la modale est ouverte ;
- bouton de telechargement PV si disponible.

## 22. Workflow complet de creation

### Etape 1 : le secretaire arrive sur le dashboard

Page :

```txt
/ouverture_offre
```

Le frontend charge :

```ts
fetchCurrentUser()
listMarkets()
getSeances()
```

### Etape 2 : le dashboard calcule les dossiers ouvrables

Si un marche n'a pas encore de seance et que la date limite est passee, l'etat devient `READY`.

### Etape 3 : clic sur Ouvrir seance

Le frontend appelle :

```ts
createSeance({
  reference_dossier: row.market.reference_number,
  objet_dossier: row.market.title,
  statut: "BROUILLON",
})
```

API :

```txt
POST /api/ouverture/seances/
```

Backend :

- `seance_list_create`
- `SeanceOuvertureSerializer`
- `create_seance`
- creation en base

### Etape 4 : redirection vers detail

Le frontend va vers :

```txt
/ouverture_offre/<id>
```

### Etape 5 : saisie de la seance

Le secretaire renseigne :

- date ;
- heure ;
- lieu ;
- president ;
- membres ;
- etat scelle ;
- ratures ;
- offres.

### Etape 6 : enregistrement brouillon

API :

```txt
PATCH /api/ouverture/seances/<id>/
```

Avec statut :

```json
{ "statut": "BROUILLON" }
```

### Etape 7 : transmission aux membres

API :

```txt
PATCH /api/ouverture/seances/<id>/
```

Avec statut :

```json
{ "statut": "EN_VALIDATION_MEMBRES" }
```

Backend :

- verifie les champs obligatoires ;
- verifie minimum 3 membres ;
- envoie notifications membres.

## 23. Workflow complet de validation

### Etape 1 : un membre ouvre la seance

Il voit la seance en lecture.

S'il est membre present et decision `EN_ATTENTE`, il peut valider ou rejeter.

### Etape 2 : validation membre

API :

```txt
POST /api/ouverture/seances/<id>/valider-membre/
```

Payload :

```json
{
  "commentaire": "...",
  "password": "..."
}
```

Backend :

- verifie mot de passe ;
- verifie droit ;
- enregistre decision ;
- si tous les membres ont valide, statut passe en `EN_VALIDATION_PRESIDENT`.

### Etape 3 : validation president

API :

```txt
POST /api/ouverture/seances/<id>/valider-president/
```

Backend :

- verifie que l'utilisateur est president ;
- verifie que tous les membres ont valide ;
- passe la seance en `VALIDEE` ;
- genere le PDF.

### Etape 4 : telechargement PV

API :

```txt
GET /api/ouverture/seances/<id>/telecharger-pv/
```

Frontend :

```ts
downloadPV(seance.id, seance.reference_dossier)
```

## 24. Exemple de JSON d'une seance

Exemple simplifie d'une reponse API :

```json
{
  "id": 12,
  "reference_dossier": "DAO-2026-001",
  "objet_dossier": "Fourniture de materiels",
  "date_seance": "2026-05-20",
  "heure_seance": "10:00:00",
  "lieu": "Salle UCP",
  "statut": "EN_VALIDATION_MEMBRES",
  "secretaire": 2,
  "president": 5,
  "membres": [
    {
      "id": 1,
      "utilisateur": 7,
      "decision": "EN_ATTENTE",
      "est_present": true
    }
  ],
  "offres": [
    {
      "id": 1,
      "ordre_passage": 1,
      "nom_soumissionnaire": "Entreprise A",
      "pli_existe": true,
      "montant_global": "1500000.00"
    }
  ],
  "pv_document": null
}
```

## 25. Pourquoi backend et frontend verifient parfois la meme chose ?

Exemple :

- le frontend verifie qu'il y a au moins 3 membres ;
- le backend verifie aussi.

Ce n'est pas une duplication inutile.

Le frontend verifie pour aider l'utilisateur rapidement.

Le backend verifie pour proteger les donnees.

Regle importante :

```txt
Le frontend facilite.
Le backend garantit.
```

## 26. Logique Merise simplifiee

### Entites

Entite `SEANCE_OUVERTURE`

- id
- reference_dossier
- objet_dossier
- date_seance
- heure_seance
- lieu
- statut

Entite `UTILISATEUR`

- id
- username
- email

Entite `OFFRE_OUVERTURE`

- id
- nom_soumissionnaire
- pli_existe
- montant_global

Entite `PV_DOCUMENT`

- id
- fichier
- hash_document
- version

### Associations

```txt
UTILISATEUR 0,n ---- cree ---- 1,1 SEANCE_OUVERTURE
UTILISATEUR 0,n ---- preside ---- 0,1 SEANCE_OUVERTURE
SEANCE_OUVERTURE 1,n ---- a_pour_membre ---- 1,1 MEMBRE_SEANCE
UTILISATEUR 0,n ---- participe ---- 1,1 MEMBRE_SEANCE
SEANCE_OUVERTURE 0,n ---- contient ---- 1,1 OFFRE_OUVERTURE
SEANCE_OUVERTURE 0,1 ---- genere ---- 1,1 PV_DOCUMENT
```

### Pourquoi MembreSeance est une table ?

Parce que l'association `participe` a ses propres attributs :

- est_present ;
- decision ;
- commentaire ;
- date_validation.

En Merise, une association avec attributs devient souvent une table dans le modele relationnel.

## 27. SQL mental : comment penser les requetes

Quand Django fait :

```py
seance.membres.filter(est_present=True)
```

Tu peux l'imaginer comme :

```sql
SELECT *
FROM ouverture_offre_membreseance
WHERE seance_id = 12
AND est_present = true;
```

Quand Django fait :

```py
SeanceOuverture.objects.filter(pk=pk).first()
```

Tu peux l'imaginer comme :

```sql
SELECT *
FROM ouverture_offre_seanceouverture
WHERE id = pk
LIMIT 1;
```

Quand Django cree une offre :

```py
OffreOuverture.objects.create(...)
```

Tu peux l'imaginer comme :

```sql
INSERT INTO ouverture_offre_offreouverture (...)
VALUES (...);
```

## 28. POO dans ce module

Tu etudies la POO, donc regarde :

```py
class SeanceOuverture(models.Model):
```

`SeanceOuverture` est une classe.

Un enregistrement est un objet :

```py
seance = SeanceOuverture.objects.get(id=12)
```

Puis :

```py
seance.statut = "VALIDEE"
seance.save()
```

Tu modifies l'objet Python, puis Django transforme cela en UPDATE SQL.

Autre exemple :

```py
class Statut(models.TextChoices):
```

C'est une classe interne qui organise les valeurs autorisees.

Cela evite d'ecrire n'importe quoi comme statut.

## 29. Pourquoi `related_name` ?

Exemple :

```py
secretaire = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    related_name="seances_creees_ouverture",
)
```

Cela permet de faire :

```py
user.seances_creees_ouverture.all()
```

C'est le chemin inverse : depuis un utilisateur, retrouver les seances qu'il a creees.

Autre exemple :

```py
related_name="membres"
```

Permet :

```py
seance.membres.all()
```

## 30. Pourquoi `CASCADE` pour offres et membres ?

Dans `MembreSeance` et `OffreOuverture`, on a :

```py
on_delete=models.CASCADE
```

Cela veut dire :

Si la seance est supprimee, ses membres et ses offres sont supprimes aussi.

Pourquoi ? Parce qu'une offre d'ouverture n'a pas de sens sans sa seance.

Mais pour les utilisateurs, on utilise `PROTECT`, car un utilisateur garde une valeur d'historique.

## 31. Les points a surveiller

### 31.1 Ancien statut `A_VALIDER`

Dans le frontend, les types et certains mappings connaissent encore `A_VALIDER`.

Dans le backend actuel, les statuts sont maintenant separes :

- `EN_VALIDATION_MEMBRES`
- `EN_VALIDATION_PRESIDENT`

Cela ressemble a une compatibilite avec l'ancien code ou anciennes donnees. Ce n'est pas forcement mauvais, mais il faut savoir que `A_VALIDER` est un ancien nom.

### 31.2 list_visible_seances ne filtre pas encore par utilisateur

La fonction s'appelle `list_visible_seances(user)`, mais actuellement elle retourne toutes les seances.

Le frontend filtre ensuite selon le role. Si un jour il faut renforcer la confidentialite, il faudra filtrer aussi cote backend.

Regle de securite :

```txt
Ne jamais compter uniquement sur le frontend pour cacher des donnees sensibles.
```

### 31.3 Trace IP et navigateur

Le backend prend :

```py
HTTP_X_FORWARDED_FOR
REMOTE_ADDR
HTTP_USER_AGENT
```

C'est utile pour l'audit. Mais selon le deploiement, il faut configurer correctement le proxy serveur pour avoir une IP fiable.

## 32. Comment deboguer le module

### Probleme : le bouton n'apparait pas

Verifier :

- l'utilisateur est-il secretaire ?
- le DAO a-t-il une date limite passee ?
- le marche est-il `CLOSED` ?
- une seance existe-t-elle deja ?

Fichiers a regarder :

- `page.tsx`
- fonction `getOpeningState`
- fonction `isSecretaireUser`

### Probleme : impossible de sauvegarder

Verifier :

- statut `BROUILLON` ou `EN_SAISIE` ?
- utilisateur = secretaire de la seance ?
- backend retourne quelle erreur ?

Fichiers :

- `SeanceOuvertureDetail.tsx`
- `seance_serializer.py`
- `seance_service.py`

### Probleme : un membre ne peut pas valider

Verifier :

- la seance est-elle en `EN_VALIDATION_MEMBRES` ?
- l'utilisateur est-il dans `membres` ?
- `est_present` est-il true ?
- `decision` est-il `EN_ATTENTE` ?

Fichier principal :

- `validate_member` dans `seance_service.py`

### Probleme : le president ne peut pas valider

Verifier :

- la seance est-elle en `EN_VALIDATION_PRESIDENT` ?
- l'utilisateur connecte est-il le president ?
- tous les membres presents ont-ils `decision = VALIDEE` ?
- `president_decision` est-il encore `EN_ATTENTE` ?

### Probleme : PV absent

Verifier :

- la seance est-elle `VALIDEE` ou `ARCHIVEE` ?
- `pv_document` existe-t-il ?
- `reportlab` est-il installe ?
- le dossier media est-il accessible en ecriture ?

## 33. Carte des fichiers

### Backend

```txt
backend_PPM/apps/ouverture_offre/
  models/
    seance_ouverture.py      Table principale
    membre_seance.py         Membres et validations membres
    offre_ouverture.py       Offres / plis
    pv_document.py           PV PDF
    __init__.py              Exporte les modeles

  serializers/
    user_serializer.py       User simple pour JSON
    seance_serializer.py     JSON seance, membres, offres, validation

  services/
    seance_service.py        Workflow metier
    notification_service.py  Emails
    pdf_service.py           Generation PV PDF

  views/
    user_view.py             Liste utilisateurs
    seance_view.py           API seance et validation
    __init__.py              Exporte les views

  urls.py                    Routes API du module
  permissions.py             Permission secretaire ou lecture
  apps.py                    Declaration app Django
  admin.py                   Admin Django
```

### Frontend

```txt
ucp-frontend/src/app/ouverture_offre/
  page.tsx                         Dashboard
  nouvelle/page.tsx                Ancienne page informative
  [id]/page.tsx                    Route detail
  components/
    SeanceOuvertureDetail.tsx      Formulaire + validation
    SeanceOverviewDetails.tsx      Vue lecture detaillee
    SeanceOverviewModal.tsx        Modale

ucp-frontend/src/services/
  ouvertureOffre.ts                Appels API

ucp-frontend/src/types/
  ouvertureOffre.ts                Types TypeScript

ucp-frontend/src/app/api/[...path]/route.ts
  Proxy vers Django
```

## 34. Mini glossaire

`GET` : lire des donnees.

`POST` : creer ou declencher une action.

`PATCH` : modifier une partie d'une ressource.

`401` : non connecte ou token invalide.

`403` : connecte mais pas autorise.

`404` : ressource introuvable.

`500` : erreur serveur.

`JSON` : format texte utilise pour echanger des donnees entre frontend et backend.

`JWT` : token de connexion envoye dans le header `Authorization`.

`ORM` : outil qui permet d'utiliser des classes Python au lieu d'ecrire directement du SQL.

`Transaction` : groupe d'operations SQL qui reussissent ensemble ou echouent ensemble.

`Serializer` : traducteur entre objet Django et JSON.

`Component React` : morceau d'interface reutilisable.

`State React` : memoire locale d'un composant.

`useEffect` : action lancee quand le composant se charge ou quand une dependance change.

`useMemo` : calcul memorise pour eviter de recalculer inutilement.

## 35. Les secrets du dev a retenir

1. Commence toujours par le modele de donnees.

Si tu comprends les tables et les relations, tu comprends 50 pour cent du module.

2. Cherche le workflow.

Ici le workflow est :

```txt
BROUILLON -> EN_VALIDATION_MEMBRES -> EN_VALIDATION_PRESIDENT -> VALIDEE
```

ou :

```txt
... -> REJETEE
```

3. Separe affichage et verite.

Le frontend affiche et aide. Le backend decide et protege.

4. Suis l'appel.

Quand un bouton ne marche pas, suis :

```txt
bouton -> fonction React -> service frontend -> URL API -> view -> serializer -> service -> modele
```

5. Lis les noms.

Les bons noms racontent deja beaucoup :

- `validate_member` : valider membre ;
- `reject_president` : rejet president ;
- `replace_offres` : remplacer les offres ;
- `downloadPV` : telecharger le PV.

6. Ne fais pas confiance au formulaire.

Un utilisateur peut tricher cote frontend. Toujours verifier cote backend.

7. Garde les actions sensibles tracees.

Ici, validation et rejet enregistrent :

- user ;
- date ;
- IP ;
- navigateur ;
- commentaire.

8. Utilise les transactions.

Pour les operations importantes, `transaction.atomic` evite les donnees a moitie sauvegardees.

9. Quand tu modifies une table, pense migration.

Modele change = migration.

10. Quand tu ajoutes un champ, pense aussi a tout le chemin.

Ajouter un champ signifie souvent :

```txt
modele -> migration -> serializer -> service -> type TypeScript -> formulaire -> affichage
```

## 36. Exercices pour apprendre avec ce module

### Exercice 1 : trouver la table principale

Ouvre :

`backend_PPM/apps/ouverture_offre/models/seance_ouverture.py`

Reponds :

- quel champ identifie le DAO ?
- quel champ dit si la seance est validee ?
- quel champ relie le president ?

### Exercice 2 : suivre une validation membre

Pars du bouton frontend de validation membre dans :

`SeanceOuvertureDetail.tsx`

Puis suis :

```txt
handleMemberValidation
-> validateMember dans services/ouvertureOffre.ts
-> /valider-membre/
-> seance_validate_member
-> validate_member dans seance_service.py
```

### Exercice 3 : ajouter un champ imaginaire

Imagine un champ `nombre_plis_recus`.

Pose-toi :

- dans quel modele ?
- quel type Django ?
- faut-il une migration ?
- faut-il l'ajouter au serializer ?
- faut-il l'ajouter dans le type TypeScript ?
- faut-il l'afficher ?

### Exercice 4 : comprendre une relation

Dans Django shell, on pourrait faire :

```py
seance = SeanceOuverture.objects.first()
seance.membres.all()
seance.offres.all()
seance.pv_document
```

Observe comment `related_name` rend le code naturel.

## 37. Resume final du module

Le module `ouverture_offre` est un workflow complet :

```txt
DAO publie
  |
date limite atteinte
  |
secretaire cree une seance brouillon
  |
secretaire renseigne commission et offres
  |
transmission aux membres
  |
membres valident ou rejettent
  |
president valide ou rejette
  |
si valide : generation PV PDF
```

Backend :

- Django garde les donnees ;
- DRF valide et expose le JSON ;
- les services appliquent la logique ;
- les permissions protegent les roles.

Frontend :

- Next.js affiche le dashboard ;
- React gere les formulaires ;
- TypeScript decrit les donnees ;
- les services appellent l'API ;
- la modale et les composants affichent les details.

La grande idee a retenir :

```txt
Une fonctionnalite professionnelle est rarement juste un formulaire.
C'est un ensemble coherent : donnees, regles, securite, interface, traces, documents.
```

Quand tu comprends ca, tu commences vraiment a penser comme une developpeuse.

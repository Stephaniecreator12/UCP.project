import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.db import connections

from apps.users.models.agent import AgentProfile, Poste, Programme

logger = logging.getLogger(__name__)
User = get_user_model()

from apps.authorization.constants import (
    PUBLIC, DEMANDEUR, VALIDATEUR_HIERARCHIQUE, VALIDATEUR_TECHNIQUE,
    VALIDATEUR_PROGRAMMATIQUE, APPROBATEUR_NATIONAL,
    FINANCE, RAF, VALIDATEUR_BUDGETAIRE,
    AGENT_ACHAT, LOGISTIQUE, AGENT_MARCHE,
    SECRETAIRE, SECRETAIRE_CONTRACTUALISATION, AUDITEUR,
)

FONCTION_TO_GROUPS: dict[str, tuple[str, ...]] = {
    "AGENT SANS FONCTION": (DEMANDEUR,),
    "DEMANDEUR": (DEMANDEUR,),
    "VALIDATEUR HIERARCHIQUE": (VALIDATEUR_HIERARCHIQUE,),
    "VALIDATEUR TECHNIQUE": (VALIDATEUR_TECHNIQUE,),
    "VALIDATEUR PROGRAMMATIQUE": (VALIDATEUR_PROGRAMMATIQUE,),
    "APPROBATEUR NATIONAL": (APPROBATEUR_NATIONAL,),
    "FINANCE": (FINANCE,),
    "RAF": (RAF, VALIDATEUR_BUDGETAIRE),
    "VALIDATEUR BUDGETAIRE": (VALIDATEUR_BUDGETAIRE,),
    "AGENT ACHAT": (AGENT_ACHAT,),
    "AGENT MARCHE": (AGENT_MARCHE,),
    "LOGISTIQUE": (LOGISTIQUE,),
    "SECRETAIRE CONTRACTUALISATION": (SECRETAIRE_CONTRACTUALISATION,),
    "SECRETAIRE": (SECRETAIRE,),
    "AUDITEUR": (AUDITEUR,),
    "PUBLIC": (PUBLIC,),
}


def _resolve_groups_from_fonction(fonction: str | None) -> tuple[str, ...]:
    """Map external RH function/job title to Django group names."""
    if not fonction:
        return ("DEMANDEUR",)
    key = fonction.strip().upper()
    if key not in FONCTION_TO_GROUPS:
        logger.warning(
            "Fonction RH '%s' non reconnue dans FONCTION_TO_GROUPS, "
            "attribution du groupe DEMANDEUR par defaut. "
            "Ajoutez une entree dans FONCTION_TO_GROUPS si necessaire.",
            fonction,
        )
    return FONCTION_TO_GROUPS.get(key, ("DEMANDEUR",))

class DummyToken:
    """
    Token factice pour encapsuler les jetons d'API RH externes 
    et éviter que SimpleJWT ou DRF ne lèvent d'exceptions de type 'NoneType'.
    """
    def __init__(self, token_str):
        self.token = token_str

    def __str__(self):
        return self.token


def resolve_identity_from_db(token: str):
    """
    Tente de résoudre le token contre la base externe 'external_users'.
    Retourne un dictionnaire avec les infos utilisateur ou None.
    """
    if "external_users" not in connections:
        logger.error("La connexion 'external_users' n'est pas configurée dans DATABASES.")
        return None
    
    query = """
        SELECT u.id, u.matricule, u.nom, u.prenom, u.email, u.fonction, u.financement_actuel, u.is_active
        FROM auth_tokens t
        JOIN users u ON u.id = t.user_id
        WHERE t.key = %s
    """
    try:
        with connections["external_users"].cursor() as cursor:
            cursor.execute(query, [token])
            row = cursor.fetchone()
            if row:
                fonction = row[5] or "Agent Sans Fonction"
                return {
                    "id": str(row[0]),
                    "matricule": row[1],
                    "nom": row[2],
                    "prenom": row[3],
                    "email": row[4],
                    "fonction": fonction,
                    "programme_code": row[6] or "SANS-PROG",
                    "programme_nom": row[6] or "Sans Programme",
                    "is_active": bool(row[7]),
                    "groups": list(_resolve_groups_from_fonction(fonction)),
                }
    except Exception as e:
        logger.error(f"Impossible de requêter la base external_users : {e}")
    return None


def get_or_create_groups(group_names):
    """Récupère ou crée les groupes Django correspondants."""
    groups = []
    for name in group_names:
        if name:
            group, _ = Group.objects.get_or_create(name=name.strip())
            groups.append(group)
    return groups


def provision_user(user_data):
    """
    JIT Provisioning (Just-In-Time) :
    Crée ou met à jour l'utilisateur local Django et son profil d'agent.
    """
    email = user_data["email"].strip().lower()
    
    # 1. Vérifier si l'utilisateur est révoqué côté RH
    if not user_data["is_active"]:
        User.objects.filter(email=email).update(is_active=False)
        raise AuthenticationFailed("Ce compte RH a été désactivé.")

    # 2. Récupérer ou créer l'utilisateur Django
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "full_name": f"{user_data.get('prenom', '')} {user_data.get('nom', '')}".strip(),
            "is_active": True
        }
    )

    if not created:
        full_name = f"{user_data.get('prenom', '')} {user_data.get('nom', '')}".strip()
        if full_name:
            user.full_name = full_name
        user.is_active = True
        
    # 3. Forcer le mot de passe local à être inutilisable et sauvegarder
    user.set_unusable_password()
    user.save()

    # 4. Gérer le Programme
    prog_code = user_data["programme_code"] or "SANS-PROG"
    prog_nom = user_data["programme_nom"] or "Sans Programme"
    programme, _ = Programme.objects.get_or_create(
        code=prog_code,
        defaults={"nom": prog_nom}
    )

    # 5. Gérer le Poste
    poste, poste_created = Poste.objects.get_or_create(
        nom=user_data["fonction"] or "Agent",
        programme=programme
    )

    # Résoudre les groupes depuis les données externes ou la fonction
    group_names = user_data.get("groups") or list(_resolve_groups_from_fonction(user_data.get("fonction")))
    groups_list = get_or_create_groups(group_names)

    # Toujours mettre à jour les groupes du Poste
    poste.groups.set(groups_list)

    # 6. Créer ou mettre à jour le profil AgentProfile
    profile, _ = AgentProfile.objects.get_or_create(
        user=user,
        defaults={
            "poste": poste,
            "matricule": user_data["matricule"]
        }
    )
    if profile.poste != poste or profile.matricule != user_data["matricule"]:
        profile.poste = poste
        profile.matricule = user_data["matricule"]
        profile.save()

    # 7. Synchroniser les groupes Django de l'utilisateur avec ceux du Poste
    user.groups.add(*poste.groups.all())

    return user


class HybridJWTAuthentication(JWTAuthentication):
    """
    Système d'authentification hybride :
    1. Si le token contient un '.', c'est un JWT standard (ex: fournisseurs externes).
    2. Si le token fait 40 caractères, c'est un jeton RH (agents internes).
       On effectue alors un provisionnement automatique à la volée (JIT).
    """
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None
            
        token_str = raw_token.decode('utf-8') if isinstance(raw_token, bytes) else raw_token
        
        # Cas 1 : Token JWT Standard (Fournisseurs externes / Utilisateurs locaux)
        if '.' in token_str:
            try:
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token
            except (InvalidToken, AuthenticationFailed):
                raise

        # Cas 2 : Token RH de 40 caractères (Agents internes)
        if len(token_str) == 40:
            # A. Résoudre l'identité via la base externe
            user_data = resolve_identity_from_db(token_str)

            if not user_data:
                raise InvalidToken("Jeton RH invalide, expiré ou base RH inaccessible.")

            # B. Provisionner le compte miroir local et synchroniser ses droits
            user = provision_user(user_data)
            
            # Retourner l'utilisateur avec l'objet Token factice sécurisé
            return user, DummyToken(token_str)

        raise InvalidToken("Format de jeton inconnu.")
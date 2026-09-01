import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.db import connections
from django.core.exceptions import MultipleObjectsReturned

from apps.users.models.agent import AgentProfile, Poste, Programme

logger = logging.getLogger(__name__)
User = get_user_model()

# Liste mockée d'utilisateurs RH pour le développement et les tests locaux
# Permet de tester sans connexion réelle à la base de données des RH.
MOCK_RH_DATABASE = {
    "mock_token_cn_hashlah_940": {
        "id": "940",
        "matricule": "940/UCP",
        "nom": "CN",
        "prenom": "Validateur CN",
        "email": "hashlah940@gmail.com",
        "fonction": "Coordonnateur National",
        "programme_code": "FM",
        "programme_nom": "Fonds Mondial",
        "is_active": True,
        "groups": ["APPROBATEUR_NATIONAL", "CN"],
    },
    "mock_token_rpm_raknaliarisoa": {
        "id": "941",
        "matricule": "941/UCP",
        "nom": "RAKOTO",
        "prenom": "RPM Validateur",
        "email": "raknaliarisoa@gmail.com",
        "fonction": "Responsable Passation de Marché",
        "programme_code": "FM",
        "programme_nom": "Fonds Mondial",
        "is_active": True,
        "groups": ["RPM", "VALIDATEUR_PROGRAMMATIQUE"],
    },
    "mock_token_gp_razafi": {
        "id": "942",
        "matricule": "942/UCP",
        "nom": "RAZAFY",
        "prenom": "GP Validateur",
        "email": "razafimahaleomami@gmail.com",
        "fonction": "Gestionnaire Programme",
        "programme_code": "FM",
        "programme_nom": "Fonds Mondial",
        "is_active": True,
        "groups": ["GP", "VALIDATEUR_TECHNIQUE"],
    },
    "mock_token_nalisoa_87": {
        "id": "87",
        "matricule": "002/UCP",
        "nom": "NOMENJANAHARY",
        "prenom": "Nalisoa",
        "email": "nalisoa@ucp.mg",
        "fonction": "Gestionnaire Programme",
        "programme_code": "FM",
        "programme_nom": "Fonds Mondial",
        "is_active": True,
        "groups": ["VALIDATEUR_HIERARCHIQUE"]
    },
    "mock_token_anthony_32": {
        "id": "32",
        "matricule": "032/UCP",
        "nom": "JOHN",
        "prenom": "Anthony",
        "email": "pfgavi@ucp.mg",
        "fonction": "Point Focal",
        "programme_code": "GAVI",
        "programme_nom": "Alliance Gavi",
        "is_active": True,
        "groups": ["AGENT_ACHAT"]
    },
    "mock_token_raf_gavi_33": {
        "id": "33",
        "matricule": "033/UCP",
        "nom": "RAF_GAVI",
        "prenom": "Finance",
        "email": "raf.gavi@ucp.mg",
        "fonction": "Responsable Administratif Financier",
        "programme_code": "GAVI",
        "programme_nom": "Alliance Gavi",
        "is_active": True,
        "groups": ["RAF", "SECRETAIRE"]
    },
    "mock_token_alice_100": {
        "id": "100",
        "matricule": "100/UCP",
        "nom": "ALICE",
        "prenom": "Alice",
        "email": "alice@ucp.mg",
        "fonction": "Gestionnaire",
        "programme_code": "FM",
        "programme_nom": "Fonds Mondial",
        "is_active": True,
        "groups": []
        
    },
    "mock_token_secretaire_50": {
        "id": "50",
        "matricule": "050/UCP",
        "nom": "RAKOTO",
        "prenom": "Secrétaire",
        "email": "secretaire@ucp.mg",   # ← email différente d'Alice !
        "fonction": "Secrétaire",
        "programme_code": "FM",
        "programme_nom": "Fonds Mondial",
        "is_active": True,
        "groups": ["SECRETAIRE"]
    },
    "mock_token_contractualisation_101": {
        "id": "101",
        "matricule": "101/UCP",
        "nom": "RAKOTO",
        "prenom": "Contractualisation",
        "email": "contractualisation@ucp.mg",
        "fonction": "Secrétaire Contractualisation",
        "programme_code": "FM",
        "programme_nom": "Fonds Mondial",
        "is_active": True,
        "groups": ["LOGISTIQUE"]
    }
}

MOCK_RH_LOGIN_ALIASES = {
    "hashlah940@gmail.com": "mock_token_cn_hashlah_940",
    "cn@ucp.mg": "mock_token_cn_hashlah_940",
    "cn": "mock_token_cn_hashlah_940",
    "raknaliarisoa@gmail.com": "mock_token_rpm_raknaliarisoa",
    "rpm@ucp.mg": "mock_token_rpm_raknaliarisoa",
    "rpm": "mock_token_rpm_raknaliarisoa",
    "razafimahaleomami@gmail.com": "mock_token_gp_razafi",
    "gp@ucp.mg": "mock_token_gp_razafi",
    "gp": "mock_token_gp_razafi",
    "nalisoa@ucp.mg": "mock_token_nalisoa_87",
    "nalisoa@ucp": "mock_token_nalisoa_87",
    "pfgavi@ucp.mg": "mock_token_anthony_32",
    "pfgavi@ucp": "mock_token_anthony_32",
    "raf.gavi@ucp.mg": "mock_token_raf_gavi_33",
    "raf.gavi@ucp": "mock_token_raf_gavi_33",
    "secretaire@ucp.mg": "mock_token_secretaire_50",
    "secretaire@ucp": "mock_token_secretaire_50",
    "alice@ucp.mg": "mock_token_alice_100",
    "alice@ucp": "mock_token_alice_100",
    "contractualisation@ucp.mg": "mock_token_contractualisation_101",
    "contractualisation@ucp": "mock_token_contractualisation_101",
}


def resolve_mock_rh_login(identifier: str):
    """Return a development RH token and profile for a known local identifier."""
    if not settings.DEBUG:
        return None

    normalized = (identifier or "").strip().lower()
    token = MOCK_RH_LOGIN_ALIASES.get(normalized)
    if not token:
        return None

    user_data = MOCK_RH_DATABASE.get(token)
    if not user_data:
        return None

    return token, user_data

def resolve_identity_from_db(token: str):
    """
    Tente de résoudre le token contre la base externe 'external_users'.
    Retourne un dictionnaire avec les infos utilisateur ou None.
    """
    if "external_users" not in connections:
        return None
    
    # NOTE: Cette requête SQL est indicative et doit être adaptée
    # au schéma réel de la base de données RH.
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
                return {
                    "id": str(row[0]),
                    "matricule": row[1],
                    "nom": row[2],
                    "prenom": row[3],
                    "email": row[4],
                    "fonction": row[5],
                    "programme_code": row[6],
                    "programme_nom": row[6],  # utilisé comme nom par défaut
                    "is_active": bool(row[7]),
                    "groups": [] # Résolu dynamiquement par la suite
                }
    except Exception as e:
        logger.warning(f"Impossible de se connecter à external_users : {e}")
    return None

def get_or_create_groups(group_names):
    """Récupère ou crée les groupes Django correspondants."""
    groups = []
    for name in group_names:
        group, _ = Group.objects.get_or_create(name=name)
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
        # Si le compte existe localement, on le désactive immédiatement
        User.objects.filter(email=email).update(is_active=False)
        raise AuthenticationFailed("Ce compte RH a été désactivé.")

    # 2. Récupérer ou créer l'utilisateur Django
    try:
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "first_name": user_data["prenom"],
                "last_name": user_data["nom"],
                "is_active": True
            }
        )
    except MultipleObjectsReturned:
        # Si plusieurs comptes locaux existent pour le même email,
        # choisir un enregistrement canonique (le plus ancien) et
        # mettre à jour ses champs. Ne pas lever d'exception pour
        # éviter d'interrompre le flux d'authentification.
        logger.warning("Multiple users found for email %s during provisioning; selecting the first.", email)
        qs = User.objects.filter(email=email).order_by('id')
        user = qs.first()
        created = False
        if user is None:
            # Très improbable : si aucun utilisateur n'est trouvé, créer un nouveau.
            user = User.objects.create(
                username=email,
                email=email,
                first_name=user_data["prenom"],
                last_name=user_data["nom"],
                is_active=True,
            )
            created = True

    if not created:
        # Mettre à jour les informations de base
        user.first_name = user_data["prenom"]
        user.last_name = user_data["nom"]
        user.is_active = True
        user.save()

    # 3. Forcer le mot de passe local à être inutilisable (Sécurité)
    user.set_unusable_password()

    # 4. Gérer le Programme
    prog_code = user_data["programme_code"]
    prog_nom = user_data["programme_nom"]
    programme, _ = Programme.objects.get_or_create(
        code=prog_code,
        defaults={"nom": prog_nom}
    )

    # 5. Gérer le Poste
    poste, _ = Poste.objects.get_or_create(
        nom=user_data["fonction"],
        programme=programme
    )

    # Associer les groupes par défaut au poste s'il vient d'être créé
    if user_data.get("groups"):
        groups_list = get_or_create_groups(user_data["groups"])
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
    user.groups.set(poste.groups.all())

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
        
        # Cas 1 : Token JWT Standard (Fournisseurs externes)
        if '.' in token_str:
            try:
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token
            except (InvalidToken, AuthenticationFailed):
                raise

        # Cas 2 : Token RH de 40 caractères (Agents internes)
        if len(token_str) == 40 or token_str.startswith("mock_token_"):
            # A. Résoudre l'identité (via DB externe ou Mock local)
            user_data = resolve_identity_from_db(token_str)
            if not user_data and settings.DEBUG:
                # Utiliser le dictionnaire mocké en mode DEBUG si pas de DB externe
                user_data = MOCK_RH_DATABASE.get(token_str)

            if not user_data:
                raise InvalidToken("Jeton RH invalide ou expiré.")

            # B. Provisionner le compte miroir local et synchroniser ses droits
            user = provision_user(user_data)
            
            # Stocker temporairement le token RH sur l'objet utilisateur
            user.token = token_str
            return user, None

        raise InvalidToken("Format de jeton inconnu.")

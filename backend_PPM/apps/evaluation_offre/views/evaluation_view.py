from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from decimal import Decimal

from apps.evaluation_offre.serializers import (
    AssignationEvaluateursSerializer,
    DecisionFinaleSerializer,
    EvaluationFinanciereSerializer,
    EvaluationOffreDetailSerializer,
    EvaluationOffreListSerializer,
    EvaluationTechniqueSerializer,
    ExamenPreliminaireSerializer,
    OffreAssignationSerializer,
    SaveEvaluationSerializer,
)
from apps.evaluation_offre.services.evaluation_service import (
    assigner_evaluateurs,
    assigner_evaluateurs_seance,
    consolider_decision_finale,
    get_classement_seance,
    get_dao_detail,
    get_evaluation_detail,
    list_dao_dashboard,
    list_dao_offres,
    list_offres_a_assigner,
    list_offres_a_evaluer,
    login_evaluateur_dao,
    renvoyer_invitations_evaluateurs_seance,
    sauvegarder_evaluation,
    soumettre_evaluation_financiere,
    soumettre_evaluation_technique,
    soumettre_examen_preliminaire,
)
from apps.evaluation_offre.services.validation_access_service import get_evaluation_with_password

# On importe les permissions spécifiques à l'évaluation(groupes Evaluateur, Secretaire, President)
from apps.evaluation_offre.permissions import (
    IsEvaluateur,
    IsSecretaire,
)

# ============================================================
# LISTE DES OFFRES D'UN DAO POUR L'ÉVALUATEUR
# GET /evaluations/dao/<seance_id>/offres/
# ============================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dao_offres_list(request, seance_id: int):
    payload = list_dao_offres(seance_id, request.user)
    return Response(payload)


# ============================================================
# CRITÈRES TECHNIQUES D'UNE SÉANCE
# GET /evaluations/dao/<seance_id>/criteres/
# ============================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def criteres_techniques_view(request, seance_id: int):
    from apps.evaluation_offre.models import CritereTechnique
    from apps.ouverture_offre.models import SeanceOuverture

    try:
        seance = SeanceOuverture.objects.get(pk=seance_id)
    except SeanceOuverture.DoesNotExist:
        return Response(
            {"detail": "Séance introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    criteres = (
        CritereTechnique.objects
        .filter(seance=seance, actif=True)
        .order_by("ordre", "nom")
        .values("id", "nom", "description", "ponderation", "ordre", "actif")
    )
    return Response(list(criteres))


# ============================================================
# CLASSEMENT FINAL D'UN DAO
# GET /evaluations/dao/<seance_id>/classement/
# ============================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def classement_view(request, seance_id: int):
    payload = get_classement_seance(seance_id, request.user)
    return Response(payload)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsSecretaire])
def assignation_list(request):
    items = list_dao_dashboard(request.user)
    return Response(items)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsSecretaire])
def dao_dashboard_view(request):
    items = list_dao_dashboard(request.user)
    return Response(items)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsSecretaire])
def dao_detail_view(request, seance_id: int):
    payload = get_dao_detail(seance_id, request.user)
    return Response(payload)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSecretaire])
def assigner_evaluateurs_seance_view(request, seance_id: int):
    serializer = AssignationEvaluateursSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    validated: dict = dict(serializer.validated_data)  # type: ignore[arg-type]
    result = assigner_evaluateurs_seance(
        seance_id,
        request.user,
        evaluateur_ids=list(validated.get("evaluateur_ids") or []),
        commission_members=list(validated.get("commission_members") or []),
        date_evaluation=validated.get("date_evaluation"),
        heure_evaluation=validated.get("heure_evaluation"),
        offres_metadata=list(validated.get("offres") or []),
    )
    emails_envoyes = result["emails_envoyes"]
    return Response(
        {
            "detail": f"3 évaluateurs assignés au DAO. {emails_envoyes} email(s) envoyé(s).",
            "emails_envoyes": emails_envoyes,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSecretaire])
def renvoyer_invitations_evaluateurs_seance_view(request, seance_id: int):
    payload = renvoyer_invitations_evaluateurs_seance(seance_id, request.user)
    return Response(payload, status=status.HTTP_200_OK)


@api_view(["POST"])
def login_evaluateur_dao_view(request):
    email = (request.data.get("email") or "").strip()
    password = (request.data.get("password") or "").strip()
    seance_raw = request.data.get("seance_id") or request.data.get("seance")
    seance_id = int(seance_raw) if seance_raw not in (None, "") else None
    payload = login_evaluateur_dao(email, password, seance_id)
    return Response(payload, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_evaluateur_password_view(request):
    from apps.evaluation_offre.services.validation_access_service import (
        verify_evaluator_password,
    )

    password = (request.data.get("password") or "").strip()
    seance_raw = request.data.get("seance_id") or request.data.get("seance")
    seance_id = int(seance_raw) if seance_raw not in (None, "") else None
    verify_evaluator_password(request.user, password, seance_id)
    return Response({"detail": "Mot de passe confirmé."}, status=status.HTTP_200_OK)


# ============================================================
# LISTE DES OFFRES À ÉVALUER
# GET /evaluations/
# ============================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def evaluation_list(request):
    evaluations = list_offres_a_evaluer(request.user)
    serializer = EvaluationOffreListSerializer(evaluations, many=True)
    return Response(serializer.data)


# ============================================================
# DÉTAIL COMPLET D'UNE ÉVALUATION
# GET /evaluations/<offre_id>/
# ============================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def evaluation_detail(request, offre_id: int):
    evaluation = get_evaluation_detail(offre_id, request.user)
    serializer = EvaluationOffreDetailSerializer(evaluation)
    return Response(serializer.data)


# ============================================================
# ACCÈS PAR EMAIL + CODE (pour évaluateurs sans compte)
# POST /evaluations/<offre_id>/access/
# Body: { "email": "a@b.c", "code": "ABC-..." }
# ============================================================
@api_view(["POST"])
def evaluation_access(request, offre_id: int):
    email = (request.data.get("email") or "").strip()
    code = (request.data.get("code") or "").strip()
    evaluation = get_evaluation_with_password(offre_id, email=email, password=code)
    serializer = EvaluationOffreDetailSerializer(evaluation)
    return Response(serializer.data)


# ============================================================
# ASSIGNER 3 ÉVALUATEURS À UNE OFFRE
# POST /evaluations/<offre_id>/assigner/
# Body: { "evaluateur_ids": [1, 2, 3] }
# ============================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSecretaire])
def assigner_evaluateurs_view(request, offre_id: int):
    serializer = AssignationEvaluateursSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # On extrait manuellement pour que Pylance comprenne les types
    validated: dict = dict(serializer.validated_data)  # type: ignore[arg-type]
    evaluateur_ids: list = list(validated.get("evaluateur_ids") or [])
    commission_members: list = list(validated.get("commission_members") or [])

    result = assigner_evaluateurs(
        offre_id,
        request.user,
        evaluateur_ids=evaluateur_ids,
        commission_members=commission_members,
        lot_numero=validated.get("lot_numero"),
        nif_stat=validated.get("nif_stat"),
        nom_soumissionnaire=validated.get("nom_soumissionnaire"),
        date_evaluation=validated.get("date_evaluation"),
    )
    evaluations = result["evaluations"]
    emails_envoyes = result["emails_envoyes"]
    return Response(
        {
            "detail": f"{len(evaluations)} évaluateurs assignés avec succès. {emails_envoyes} email(s) envoyé(s).",
            "emails_envoyes": emails_envoyes,
        },
        status=status.HTTP_201_CREATED,
    )


# ============================================================
# SECTION 2 — EXAMEN PRÉLIMINAIRE
# POST /evaluations/<offre_id>/examen-preliminaire/
# Body: { "offre_signee": true, "garantie_conforme": true, ... }
# ============================================================
@api_view(["POST"])
def soumettre_examen_view(request, offre_id: int):
    # Accept either authenticated evaluateur OR email+code in body
    if request.user and request.user.is_authenticated:
        acting_user = request.user
    else:
        email = (request.data.get("email") or "").strip()
        code = (request.data.get("code") or "").strip()
        evaluation = get_evaluation_with_password(offre_id, email=email, password=code)
        acting_user = evaluation.evaluateur

    serializer = ExamenPreliminaireSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    validated: dict = dict(serializer.validated_data)  # type: ignore[arg-type]

    examen = soumettre_examen_preliminaire(
        offre_id,
        validated,
        acting_user,
    )
    return Response(
        ExamenPreliminaireSerializer(examen).data,
        status=status.HTTP_200_OK,
    )


# ============================================================
# SECTION 3 — ÉVALUATION TECHNIQUE
# POST /evaluations/<offre_id>/technique/
# Body: { "note_conformite_technique": 4, "note_delai_livraison": 3, ... }
# ============================================================
@api_view(["POST"])
def soumettre_technique_view(request, offre_id: int):
    if request.user and request.user.is_authenticated:
        acting_user = request.user
    else:
        email = (request.data.get("email") or "").strip()
        code = (request.data.get("code") or "").strip()
        evaluation = get_evaluation_with_password(offre_id, email=email, password=code)
        acting_user = evaluation.evaluateur

    serializer = EvaluationTechniqueSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    validated: dict = dict(serializer.validated_data)  # type: ignore[arg-type]

    tech = soumettre_evaluation_technique(
        offre_id,
        validated,
        acting_user,
    )
    return Response(
        EvaluationTechniqueSerializer(tech).data,
        status=status.HTTP_200_OK,
    )


# ============================================================
# SECTION 4 — ÉVALUATION FINANCIÈRE (double aveugle)
# POST /evaluations/<offre_id>/financiere/
# Body: { "montant_lu": 5000000, ... }
# Bloqué tant que les 3 évaluateurs n'ont pas validé la technique
# ============================================================
@api_view(["POST"])
def soumettre_financiere_view(request, offre_id: int):
    if request.user and request.user.is_authenticated:
        acting_user = request.user
    else:
        email = (request.data.get("email") or "").strip()
        code = (request.data.get("code") or "").strip()
        evaluation = get_evaluation_with_password(offre_id, email=email, password=code)
        acting_user = evaluation.evaluateur

    serializer = EvaluationFinanciereSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    validated: dict = dict(serializer.validated_data)  # type: ignore[arg-type]

    # On s'assure que les montants sont bien des Decimal
    for champ in ["montant_lu", "corrections_arithmetiques", "rabais_accordes", "offre_moins_disante"]:
        val = validated.get(champ)
        if val is not None:
            validated[champ] = Decimal(str(val))

    fin = soumettre_evaluation_financiere(
        offre_id,
        validated,
        acting_user,
    )
    return Response(
        EvaluationFinanciereSerializer(fin).data,
        status=status.HTTP_200_OK,
    )


# ============================================================
# CONSOLIDATION FINALE
# POST /evaluations/<offre_id>/consolider/
# Body: { "recommandation": "ATTRIBUER", "justification": "...", "declaration_conflit": true }
# ============================================================
@api_view(["POST"])
def consolider_decision_view(request, offre_id: int):
    if request.user and request.user.is_authenticated:
        acting_user = request.user
    else:
        email = (request.data.get("email") or "").strip()
        code = (request.data.get("code") or "").strip()
        evaluation = get_evaluation_with_password(offre_id, email=email, password=code)
        acting_user = evaluation.evaluateur

    serializer = DecisionFinaleSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)

    validated: dict = dict(serializer.validated_data)  # type: ignore[arg-type]

    decision = consolider_decision_finale(
        offre_id,
        validated,
        acting_user,
    )
    return Response(
        DecisionFinaleSerializer(decision).data,
        status=status.HTTP_200_OK,
    )


# ============================================================
# SAUVEGARDE UNIFIÉE DU FORMULAIRE
# POST /evaluations/<offre_id>/save/
# ============================================================
@api_view(["POST"])
def sauvegarder_evaluation_view(request, offre_id: int):
    serializer = SaveEvaluationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    validated: dict = dict(serializer.validated_data)  # type: ignore[arg-type]

    if request.user and request.user.is_authenticated:
        acting_user = request.user
        validated.pop("email", None)
        validated.pop("code", None)
    else:
        email = (validated.pop("email", "") or "").strip()
        code = (validated.pop("code", "") or "").strip()
        evaluation = get_evaluation_with_password(offre_id, email=email, password=code)
        acting_user = evaluation.evaluateur

    evaluation = sauvegarder_evaluation(offre_id, validated, acting_user)
    return Response(
        EvaluationOffreDetailSerializer(evaluation).data,
        status=status.HTTP_200_OK,
    )

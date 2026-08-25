from decimal import Decimal

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core import mail
from django.test import TestCase, override_settings, RequestFactory
from rest_framework.exceptions import ValidationError

from apps.evaluation_offre.admin import (
    CritereTechniqueAdmin,
    EvaluationTechniqueAdmin,
    NoteTechniqueCritereAdmin,
)
from apps.evaluation_offre.models import (
    CritereTechnique,
    CritereTemplate,
    EvaluationOffre,
    EvaluationSeanceAssignation,
    EvaluationTechnique,
    NoteTechniqueCritere,
)
from apps.evaluation_offre.services.evaluation_service import assigner_evaluateurs_seance
from apps.ouverture_offre.models import OffreOuverture, SeanceOuverture


User = get_user_model()


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="sender@example.test",
    FRONTEND_APP_URL="http://frontend.test",
    EVALUATION_NOTIFICATION_EMAILS_ENABLED=True,
    EVALUATION_EMAIL_SUBJECT_PREFIX="[UCP Evaluation] ",
)
class EvaluationNotificationTests(TestCase):
    def setUp(self):
        mail.outbox = []
        self.secretaire = User.objects.create_user(
            email="secretaire-eval@example.test",
            password="secret123",
            full_name="Secretaire Eval",
        )
        self.seance = SeanceOuverture.objects.create(
            reference_dossier="DAO/2026/EVAL",
            objet_dossier="Evaluation test",
            secretaire=self.secretaire,
            statut=SeanceOuverture.Statut.VALIDEE,
        )
        self.offre = OffreOuverture.objects.create(
            seance=self.seance,
            ordre_passage=1,
            nom_soumissionnaire="Soumissionnaire A",
        )

    def _create_evaluators(self):
        return [
            User.objects.create_user(
                email=f"eval-{idx}@example.test",
                password="secret123",
                full_name=f"Evaluateur {idx}",
            )
            for idx in range(1, 4)
        ]

    def test_assigner_evaluateurs_seance_sends_one_email_per_evaluator(self):
        evaluators = self._create_evaluators()

        result = assigner_evaluateurs_seance(
            self.seance.id,
            self.secretaire,
            evaluateur_ids=[user.id for user in evaluators],
        )

        self.assertEqual(result["emails_envoyes"], 3)
        self.assertEqual(len(mail.outbox), 3)
        self.assertEqual(EvaluationSeanceAssignation.objects.count(), 3)
        self.assertEqual(EvaluationOffre.objects.count(), 3)
        self.assertEqual(
            {message.to[0] for message in mail.outbox},
            {user.email for user in evaluators},
        )
        self.assertTrue(
            all(message.subject.startswith("[UCP Evaluation] ") for message in mail.outbox)
        )
        self.assertIn(
            "http://frontend.test/personnel/evaluation/login",
            mail.outbox[0].alternatives[0][0],
        )
        self.assertIn("Mot de passe", mail.outbox[0].body)

    def test_assigner_evaluateurs_seance_blocks_evaluator_without_email(self):
        evaluators = self._create_evaluators()
        missing_email_user = User.objects.create_user(
            email="eval-without-email@example.test",
            password="secret123",
        )
        User.objects.filter(pk=missing_email_user.pk).update(email="")

        with self.assertRaises(ValidationError):
            assigner_evaluateurs_seance(
                self.seance.id,
                self.secretaire,
                evaluateur_ids=[
                    evaluators[0].id,
                    evaluators[1].id,
                    missing_email_user.id,
                ],
            )

        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(EvaluationSeanceAssignation.objects.count(), 0)
        self.assertEqual(EvaluationOffre.objects.count(), 0)


# ---------------------------------------------------------------------------
# Fixtures partagées pour les tests Critère technique / Évaluation technique
# ---------------------------------------------------------------------------
class _CritereTechniqueFixture:
    """Mixin qui crée une séance + offre + évaluation + critères + notes."""

    def setUp(self):
        super().setUp()
        self.secretaire = User.objects.create_user(
            email="secretaire-fixt@example.test",
            password="secret123",
            full_name="Secrétaire Fixture",
        )
        self.evaluateur = User.objects.create_user(
            email="evaluateur-fixt@example.test",
            password="secret123",
            full_name="Évaluateur Fixture",
        )
        self.seance = SeanceOuverture.objects.create(
            reference_dossier="DAO/2026/FIXT",
            objet_dossier="Fixture critères",
            secretaire=self.secretaire,
            statut=SeanceOuverture.Statut.VALIDEE,
        )
        self.offre = OffreOuverture.objects.create(
            seance=self.seance,
            ordre_passage=1,
            nom_soumissionnaire="Soumissionnaire Fixture",
        )
        self.evaluation = EvaluationOffre.objects.create(
            offre=self.offre,
            evaluateur=self.evaluateur,
            evaluateur_email="evaluateur-fixt@example.test",
        )
        self.eval_technique = EvaluationTechnique.objects.create(
            evaluation=self.evaluation,
        )
        self._creer_templates_defauts()

    def _creer_templates_defauts(self):
        """Crée les CritereTemplate par défaut pour les tests."""
        templates = [
            {"nom": "Conformité technique", "ponderation": Decimal("40.00"), "ordre": 1,
             "description": "Conformité de l'offre aux spécifications techniques"},
            {"nom": "Délai de livraison", "ponderation": Decimal("25.00"), "ordre": 2,
             "description": "Respect des délais de livraison proposés"},
            {"nom": "Expérience marchés similaires", "ponderation": Decimal("20.00"), "ordre": 3,
             "description": "Expérience du soumissionnaire dans des marchés comparables"},
            {"nom": "SAV, garantie, formation", "ponderation": Decimal("15.00"), "ordre": 4,
             "description": "Qualité du SAV, garanties et formations prévues"},
        ]
        for t in templates:
            CritereTemplate.objects.get_or_create(
                category_type="BIENS",
                nom=t["nom"],
                defaults=t,
            )


# ---------------------------------------------------------------------------
# Tests CritereTechnique — modèle
# ---------------------------------------------------------------------------
class CritereTechniqueModelTests(_CritereTechniqueFixture, TestCase):
    def test_creer_defauts_pour_seance(self):
        CritereTechnique.creer_defauts_pour_seance(self.seance, category_type="BIENS")

        criteres = CritereTechnique.objects.filter(seance=self.seance)
        self.assertEqual(criteres.count(), 4)

        noms = list(criteres.values_list("nom", flat=True))
        self.assertIn("Conformité technique", noms)
        self.assertIn("Délai de livraison", noms)
        self.assertIn("Expérience marchés similaires", noms)
        self.assertIn("SAV, garantie, formation", noms)

    def test_creer_defauts_idempotent(self):
        CritereTechnique.creer_defauts_pour_seance(self.seance, category_type="BIENS")
        CritereTechnique.creer_defauts_pour_seance(self.seance, category_type="BIENS")

        self.assertEqual(
            CritereTechnique.objects.filter(seance=self.seance).count(), 4
        )

    def test_ponderation_sum(self):
        CritereTechnique.creer_defauts_pour_seance(self.seance, category_type="BIENS")
        total = sum(
            CritereTechnique.objects.filter(seance=self.seance).values_list(
                "ponderation", flat=True
            )
        )
        self.assertEqual(total, Decimal("100.00"))

    def test_str_contains_no_percent_symbol(self):
        critere = CritereTechnique.objects.create(
            seance=self.seance,
            nom="Conformité",
            ponderation=Decimal("40.00"),
            ordre=1,
        )
        result = str(critere)
        self.assertNotIn("%", result)
        self.assertIn("40.00", result)
        self.assertIn("DAO/2026/FIXT", result)

    def test_unique_together_seance_nom(self):
        CritereTechnique.objects.create(
            seance=self.seance, nom="Critère A", ponderation=Decimal("50.00"), ordre=1
        )
        with self.assertRaises(Exception):
            CritereTechnique.objects.create(
                seance=self.seance, nom="Critère A", ponderation=Decimal("50.00"), ordre=2
            )


# ---------------------------------------------------------------------------
# Tests EvaluationTechnique — modèle
# ---------------------------------------------------------------------------
class EvaluationTechniqueModelTests(_CritereTechniqueFixture, TestCase):
    def test_calculer_score_no_criteres(self):
        score = self.eval_technique.calculer_score()
        self.assertIsNone(score)

    def test_calculer_score_with_notes(self):
        CritereTechnique.creer_defauts_pour_seance(self.seance, category_type="BIENS")
        criteres = list(CritereTechnique.objects.filter(seance=self.seance))

        NoteTechniqueCritere.objects.create(
            evaluation_technique=self.eval_technique,
            critere=criteres[0],
            note=Decimal("5.0"),
        )
        NoteTechniqueCritere.objects.create(
            evaluation_technique=self.eval_technique,
            critere=criteres[1],
            note=Decimal("4.0"),
        )
        NoteTechniqueCritere.objects.create(
            evaluation_technique=self.eval_technique,
            critere=criteres[2],
            note=Decimal("3.0"),
        )
        NoteTechniqueCritere.objects.create(
            evaluation_technique=self.eval_technique,
            critere=criteres[3],
            note=Decimal("4.0"),
        )

        score = self.eval_technique.calculer_score()
        self.assertIsNotNone(score)
        self.assertGreater(score, Decimal("0"))

    def test_save_auto_qualifies(self):
        CritereTechnique.creer_defauts_pour_seance(self.seance, category_type="BIENS")
        criteres = list(CritereTechnique.objects.filter(seance=self.seance))

        for c in criteres:
            NoteTechniqueCritere.objects.create(
                evaluation_technique=self.eval_technique,
                critere=c,
                note=Decimal("5.0"),
            )

        self.eval_technique.save()
        self.eval_technique.refresh_from_db()

        self.assertIsNotNone(self.eval_technique.score_technique_total)
        self.assertGreaterEqual(self.eval_technique.score_technique_total, 70)
        self.assertTrue(self.eval_technique.qualifie_technique)

    def test_save_auto_disqualifies_low_score(self):
        CritereTechnique.creer_defauts_pour_seance(self.seance, category_type="BIENS")
        criteres = list(CritereTechnique.objects.filter(seance=self.seance))

        for c in criteres:
            NoteTechniqueCritere.objects.create(
                evaluation_technique=self.eval_technique,
                critere=c,
                note=Decimal("1.0"),
            )

        self.eval_technique.save()
        self.eval_technique.refresh_from_db()

        self.assertIsNotNone(self.eval_technique.score_technique_total)
        self.assertLess(self.eval_technique.score_technique_total, 70)
        self.assertFalse(self.eval_technique.qualifie_technique)

    def test_has_created_at_and_updated_at(self):
        self.assertIsNotNone(self.eval_technique.created_at)
        self.assertIsNotNone(self.eval_technique.updated_at)


# ---------------------------------------------------------------------------
# Tests NoteTechniqueCritere — modèle
# ---------------------------------------------------------------------------
class NoteTechniqueCritereModelTests(_CritereTechniqueFixture, TestCase):
    def test_create_and_str(self):
        CritereTechnique.creer_defauts_pour_seance(self.seance, category_type="BIENS")
        critere = CritereTechnique.objects.filter(seance=self.seance).first()

        note = NoteTechniqueCritere.objects.create(
            evaluation_technique=self.eval_technique,
            critere=critere,
            note=Decimal("4.5"),
            commentaire="Très bien",
        )
        result = str(note)
        self.assertIn("4.5", result)
        self.assertIn(critere.nom, result)

    def test_unique_together(self):
        CritereTechnique.creer_defauts_pour_seance(self.seance, category_type="BIENS")
        critere = CritereTechnique.objects.filter(seance=self.seance).first()

        NoteTechniqueCritere.objects.create(
            evaluation_technique=self.eval_technique,
            critere=critere,
            note=Decimal("3.0"),
        )
        with self.assertRaises(Exception):
            NoteTechniqueCritere.objects.create(
                evaluation_technique=self.eval_technique,
                critere=critere,
                note=Decimal("4.0"),
            )


# ---------------------------------------------------------------------------
# Tests Admin — changelist views (regression: ValueError format character)
# ---------------------------------------------------------------------------
class AdminChangelistRegressionTests(_CritereTechniqueFixture, TestCase):
    """Vérifie que les vues changelist admin ne lèvent pas de ValueError
    liée au caractère '%' dans les chaînes formatées par Django admin."""

    def setUp(self):
        super().setUp()
        self.admin_user = User.objects.create_superuser(
            email="admin@example.test",
            password="admin123",
            full_name="Admin",
        )
        self.client.force_login(self.admin_user)
        CritereTechnique.creer_defauts_pour_seance(self.seance, category_type="BIENS")

    def _get_changelist(self, model_admin_class, model):
        """Récupère la vue changelist via le client HTTP."""
        url = f"/admin/{model._meta.app_label}/{model._meta.model_name}/"
        response = self.client.get(url)
        return response

    def test_criteretechnique_changelist_returns_200(self):
        response = self._get_changelist(
            CritereTechniqueAdmin, CritereTechnique
        )
        self.assertEqual(response.status_code, 200)

    def test_evaluationtechnique_changelist_returns_200(self):
        response = self._get_changelist(
            EvaluationTechniqueAdmin, EvaluationTechnique
        )
        self.assertEqual(response.status_code, 200)

    def test_notetechniquecritere_changelist_returns_200(self):
        response = self._get_changelist(
            NoteTechniqueCritereAdmin, NoteTechniqueCritere
        )
        self.assertEqual(response.status_code, 200)

    def test_criteretechnique_changelist_no_valueerror(self):
        """Régression: l'action 'creer_criteres_defauts' ne doit pas
        provoquer de ValueError à cause du caractère '%'."""
        url = f"/admin/{CritereTechnique._meta.app_label}/{CritereTechnique._meta.model_name}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "ValueError", status_code=200)

    def test_admin_action_choices_loads(self):
        """Vérifie que get_action_choices ne lève pas de ValueError."""
        model_admin = CritereTechniqueAdmin(CritereTechnique, admin.site)
        request = RequestFactory().get("/")
        request.user = self.admin_user

        choices = model_admin.get_action_choices(request)
        self.assertIsInstance(choices, list)
        self.assertGreater(len(choices), 0)


# ---------------------------------------------------------------------------
# Tests Admin — fields editables
# ---------------------------------------------------------------------------
class AdminEditableFieldsTests(_CritereTechniqueFixture, TestCase):
    def setUp(self):
        super().setUp()
        self.admin_user = User.objects.create_superuser(
            email="admin-edit@example.test",
            password="admin123",
            full_name="Admin Edit",
        )
        self.client.force_login(self.admin_user)
        CritereTechnique.creer_defauts_pour_seance(self.seance, category_type="BIENS")

    def test_criteretechnique_list_editable(self):
        model_admin = CritereTechniqueAdmin(CritereTechnique, admin.site)
        self.assertIn("nom", model_admin.list_editable)
        self.assertIn("ponderation", model_admin.list_editable)
        self.assertIn("ordre", model_admin.list_editable)
        self.assertIn("actif", model_admin.list_editable)

    def test_notetechniquecritere_list_editable(self):
        model_admin = NoteTechniqueCritereAdmin(NoteTechniqueCritere, admin.site)
        self.assertIn("note", model_admin.list_editable)
        self.assertNotIn("commentaire", model_admin.list_editable)

    def test_evaluationtechnique_readonly_fields(self):
        model_admin = EvaluationTechniqueAdmin(EvaluationTechnique, admin.site)
        self.assertIn("score_technique_total", model_admin.readonly_fields)
        self.assertIn("qualifie_technique", model_admin.readonly_fields)
        self.assertIn("created_at", model_admin.readonly_fields)
        self.assertIn("updated_at", model_admin.readonly_fields)


# ---------------------------------------------------------------------------
# Tests DB schema — vérifie que les migrations sont à jour
# ---------------------------------------------------------------------------
class SchemaIntegrityTests(TestCase):
    def test_criteretechnique_table_exists(self):
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT EXISTS ("
                "  SELECT FROM information_schema.tables"
                "  WHERE table_name = 'evaluation_offre_criteretechnique'"
                ")"
            )
            exists = cursor.fetchone()[0]
        self.assertTrue(exists, "La table evaluation_offre_criteretechnique doit exister")

    def test_notetechniquecritere_table_exists(self):
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT EXISTS ("
                "  SELECT FROM information_schema.tables"
                "  WHERE table_name = 'evaluation_offre_notetechniquecritere'"
                ")"
            )
            exists = cursor.fetchone()[0]
        self.assertTrue(exists, "La table evaluation_offre_notetechniquecritere doit exister")

    def test_evaluationtechnique_has_created_at(self):
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT EXISTS ("
                "  SELECT FROM information_schema.columns"
                "  WHERE table_name = 'evaluation_offre_evaluationtechnique'"
                "    AND column_name = 'created_at'"
                ")"
            )
            exists = cursor.fetchone()[0]
        self.assertTrue(exists, "La colonne created_at doit exister sur EvaluationTechnique")

    def test_evaluationtechnique_has_updated_at(self):
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT EXISTS ("
                "  SELECT FROM information_schema.columns"
                "  WHERE table_name = 'evaluation_offre_evaluationtechnique'"
                "    AND column_name = 'updated_at'"
                ")"
            )
            exists = cursor.fetchone()[0]
        self.assertTrue(exists, "La colonne updated_at doit exister sur EvaluationTechnique")

    def test_evaluationtechnique_old_fields_removed(self):
        """Les anciennes colonnes note_ ne doivent plus exister."""
        from django.db import connection

        old_fields = [
            "note_conformite_technique",
            "note_delai_livraison",
            "note_experience",
            "note_sav_garantie",
        ]
        with connection.cursor() as cursor:
            for field in old_fields:
                cursor.execute(
                    "SELECT EXISTS ("
                    "  SELECT FROM information_schema.columns"
                    "  WHERE table_name = 'evaluation_offre_evaluationtechnique'"
                    f"    AND column_name = '{field}'"
                    ")"
                )
                exists = cursor.fetchone()[0]
                self.assertFalse(
                    exists,
                    f"La colonne {field} ne doit plus exister sur EvaluationTechnique",
                )

"""Integration tests for the TdrSt (TDR/ST) API endpoints."""

from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile

from apps.TdrSt.models.TdrSt import TdrStDocument
from apps.TdrSt.views.dashboard_view import DashboardAPIView
from testsupport import UCPAPITestCase

TECH_GROUP = "VALIDATEUR_TECHNIQUE"
FINAL_GROUP = "APPROBATEUR_NATIONAL"
AUDIT_GROUP = "AUDITEUR"


def _payload(**overrides):
    data = {
        "unite_technique": "DGRU",
        "type_document": "TDR",
        "categorie_activite": "FORMATION",
        "intitule": "Atelier de renforcement des capacites",
        "reference_ptba": "PTBA-2026-12",
        "periode_debut": "2026-02-01",
        "periode_fin": "2026-03-15",
        "duree_estimee_valeur": 30,
        "duree_estimee_unite": "JOURS",
        "sources_financement": ["FM"],
        "numero_subvention": "SUB-2026-001",
        "ligne_budgetaire": "LB-2026-01",
        "montant_estime_usd": 15000,
        "procedure_envisagee": "DC",
    }
    data.update(overrides)
    return data


class TdrStDocumentLifecycleTests(UCPAPITestCase):
    def setUp(self):
        super().setUp()
        self.demandeur = self.create_user("demandeur.tdrst@test.local")
        self.client_demandeur = self.auth_client(self.demandeur)

    def _create(self, **overrides):
        return self.client_demandeur.post(
            "/api/TdrSt/documents/", _payload(**overrides), format="json"
        )

    def test_create_requires_auth(self):
        response = self.unauth_client().post(
            "/api/TdrSt/documents/", _payload(), format="json"
        )
        self.assertEqual(response.status_code, 401)

    def test_create_document_returns_201_and_brouillon(self):
        response = self._create()
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["statut"], "BROUILLON")
        self.assertTrue(data["numero_document"].startswith("UCP/TDR/"))
        self.assertEqual(data["demandeur_username"], self.demandeur.username)

    def test_create_document_missing_required_field(self):
        payload = _payload()
        del payload["intitule"]
        response = self._create(intitule=payload.get("intitule"))
        response = self.client_demandeur.post(
            "/api/TdrSt/documents/",
            {k: v for k, v in payload.items() if k != "intitule"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_create_with_invalid_periode(self):
        response = self._create(periode_debut="2026-03-15", periode_fin="2026-02-01")
        self.assertEqual(response.status_code, 400)

    def test_create_accepts_granular_achats_source_code(self):
        response = self._create(sources_financement=["SRPS_CS7_FM"])
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["sources_financement"], ["SRPS_CS7_FM"])

    def test_create_rejects_unknown_source_code(self):
        response = self._create(sources_financement=["BADEA"])
        self.assertEqual(response.status_code, 400)

    def test_my_documents_lists_own_only(self):
        self._create()
        other = self.auth_client(self.create_user("other.tdrst@test.local"))
        other.post("/api/TdrSt/documents/", _payload(intitule="Autre atelier"), format="json")

        response = self.client_demandeur.get("/api/TdrSt/documents/me/")

        self.assertEqual(response.status_code, 200)
        items = response.json()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["demandeur_username"], self.demandeur.username)

    def test_list_scope_must_be_mine_or_all(self):
        response = self.client_demandeur.get("/api/TdrSt/documents/list/", {"scope": "other"})
        self.assertEqual(response.status_code, 400)

    def test_detail_denied_for_other_user(self):
        doc = self._create().json()
        other = self.auth_client(self.create_user("stranger@test.local"))
        response = other.get(f"/api/TdrSt/documents/{doc['id']}/")
        self.assertEqual(response.status_code, 403)

    def test_detail_readable_by_owner(self):
        doc = self._create().json()
        response = self.client_demandeur.get(f"/api/TdrSt/documents/{doc['id']}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], doc["id"])

    def test_update_document_in_brouillon(self):
        doc = self._create().json()
        response = self.client_demandeur.patch(
            f"/api/TdrSt/documents/{doc['id']}/",
            {"intitule": "Intitule mis a jour"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            TdrStDocument.objects.get(id=doc["id"]).intitule,
            "Intitule mis a jour",
        )

    def test_submit_document_requires_completion(self):
        doc = self._create(numero_subvention="", ligne_budgetaire="").json()
        response = self.client_demandeur.post(f"/api/TdrSt/documents/{doc['id']}/submit/")
        self.assertEqual(response.status_code, 400)

    def test_submit_document_transitions_to_soumis(self):
        doc = self._create().json()
        response = self.client_demandeur.post(f"/api/TdrSt/documents/{doc['id']}/submit/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["statut"], "SOUMIS")

    def test_non_owner_cannot_submit(self):
        doc = self._create().json()
        other = self.auth_client(self.create_user("interloper@test.local"))
        response = other.post(f"/api/TdrSt/documents/{doc['id']}/submit/")
        self.assertEqual(response.status_code, 403)

    def test_upload_pdf_and_increment_versions(self):
        doc = self._create().json()
        pdf = SimpleUploadedFile("tdr.pdf", b"%PDF-1.4", content_type="application/pdf")
        response = self.client_demandeur.post(
            f"/api/TdrSt/documents/{doc['id']}/upload/", {"file": pdf}, format="multipart"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["uploaded_version"], 1)

        pdf2 = SimpleUploadedFile("tdr-v2.pdf", b"%PDF-1.4 v2", content_type="application/pdf")
        response = self.client_demandeur.post(
            f"/api/TdrSt/documents/{doc['id']}/upload/", {"file": pdf2}, format="multipart"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["uploaded_version"], 2)

    def test_upload_rejects_non_pdf(self):
        doc = self._create().json()
        bad = SimpleUploadedFile("tdr.docx", b"docx", content_type="application/pdf")
        response = self.client_demandeur.post(
            f"/api/TdrSt/documents/{doc['id']}/upload/", {"file": bad}, format="multipart"
        )
        self.assertEqual(response.status_code, 400)

    def test_delete_brouillon_by_owner(self):
        doc = self._create().json()
        response = self.client_demandeur.delete(f"/api/TdrSt/documents/{doc['id']}/delete/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(TdrStDocument.objects.filter(id=doc["id"]).exists())

    def test_delete_non_brouillon_forbidden(self):
        doc = self._create().json()
        self.client_demandeur.post(f"/api/TdrSt/documents/{doc['id']}/submit/")
        response = self.client_demandeur.delete(f"/api/TdrSt/documents/{doc['id']}/delete/")
        self.assertEqual(response.status_code, 400)


class TdrStValidationWorkflowTests(UCPAPITestCase):
    def setUp(self):
        super().setUp()
        self.demandeur = self.create_user("workflow.demandeur@test.local")
        self.client_demandeur = self.auth_client(self.demandeur)
        self.tech = self.create_user(
            "workflow.tech@test.local", groups=[TECH_GROUP]
        )
        self.client_tech = self.auth_client(self.tech)
        self.approbateur = self.create_user(
            "workflow.final@test.local", groups=[FINAL_GROUP]
        )
        self.client_final = self.auth_client(self.approbateur)

    def _create_submitted(self):
        response = self.client_demandeur.post(
            "/api/TdrSt/documents/", _payload(), format="json"
        )
        doc_id = response.json()["id"]
        self.client_demandeur.post(f"/api/TdrSt/documents/{doc_id}/submit/")
        return doc_id

    def test_tech_pending_requires_tech_group(self):
        plain = self.auth_client(self.create_user("plain.workflow@test.local"))
        response = plain.get("/api/TdrSt/validations/tech/pending/")
        self.assertEqual(response.status_code, 403)

    def test_tech_pending_lists_soumis_documents(self):
        doc_id = self._create_submitted()
        response = self.client_tech.get("/api/TdrSt/validations/tech/pending/")
        self.assertEqual(response.status_code, 200)
        ids = [item["id"] for item in response.json()]
        self.assertIn(doc_id, ids)

    def test_tech_decision_favorable_moves_to_en_validation(self):
        doc_id = self._create_submitted()
        response = self.client_tech.post(
            f"/api/TdrSt/validations/tech/{doc_id}/decision/",
            {"decision": "FAVORABLE", "observations": "Conforme"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["statut"], "EN_VALIDATION")

    def test_tech_decision_a_revoir_returns_to_demandeur(self):
        doc_id = self._create_submitted()
        response = self.client_tech.post(
            f"/api/TdrSt/validations/tech/{doc_id}/decision/",
            {"decision": "A_REVOIR", "observations": "A completer"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["statut"], "A_REVOIR")

    def test_tech_decision_invalid_value(self):
        doc_id = self._create_submitted()
        response = self.client_tech.post(
            f"/api/TdrSt/validations/tech/{doc_id}/decision/",
            {"decision": "REJETE"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_final_pending_requires_approbateur_group(self):
        plain = self.auth_client(self.create_user("plain.final@test.local"))
        response = plain.get("/api/TdrSt/validations/final/pending/")
        self.assertEqual(response.status_code, 403)

    def test_full_approval_flow(self):
        doc_id = self._create_submitted()
        self.client_tech.post(
            f"/api/TdrSt/validations/tech/{doc_id}/decision/",
            {"decision": "FAVORABLE"},
            format="json",
        )
        pending = self.client_final.get("/api/TdrSt/validations/final/pending/")
        self.assertIn(doc_id, [item["id"] for item in pending.json()])

        response = self.client_final.post(
            f"/api/TdrSt/validations/final/{doc_id}/decision/",
            {"decision": "APPROUVE"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["statut"], "VALIDE")

    def test_final_rejection(self):
        doc_id = self._create_submitted()
        self.client_tech.post(
            f"/api/TdrSt/validations/tech/{doc_id}/decision/",
            {"decision": "FAVORABLE"},
            format="json",
        )
        response = self.client_final.post(
            f"/api/TdrSt/validations/final/{doc_id}/decision/",
            {"decision": "REJETE", "observations": "Budget insuffisant"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["statut"], "REJETE")

    def test_actions_validation_traceability(self):
        doc_id = self._create_submitted()
        self.client_tech.post(
            f"/api/TdrSt/validations/tech/{doc_id}/decision/",
            {"decision": "FAVORABLE"},
            format="json",
        )
        detail = self.client_demandeur.get(f"/api/TdrSt/documents/{doc_id}/")
        actions = detail.json()["actions_validation"]
        self.assertEqual(len(actions), 2)
        self.assertEqual(
            {action["etape"] for action in actions},
            {"DEPOT", "VALIDATION_TECHNIQUE"},
        )


class TdrStSuspendAuditTests(UCPAPITestCase):
    def setUp(self):
        super().setUp()
        self.demandeur = self.create_user("suspend.demandeur@test.local")
        self.client_demandeur = self.auth_client(self.demandeur)
        self.auditeur = self.create_user("auditeur@test.local", groups=[AUDIT_GROUP])
        self.client_auditeur = self.auth_client(self.auditeur)

    def test_suspend_brouillon_forbidden(self):
        doc = self.client_demandeur.post(
            "/api/TdrSt/documents/", _payload(), format="json"
        ).json()
        response = self.client_demandeur.post(f"/api/TdrSt/documents/{doc['id']}/suspend/")
        self.assertEqual(response.status_code, 400)

    def test_suspend_submitted_document(self):
        doc = self.client_demandeur.post(
            "/api/TdrSt/documents/", _payload(), format="json"
        ).json()
        self.client_demandeur.post(f"/api/TdrSt/documents/{doc['id']}/submit/")
        response = self.client_demandeur.post(f"/api/TdrSt/documents/{doc['id']}/suspend/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["statut"], "SUSPENDU")

    def test_auditeur_requires_audit_group(self):
        plain = self.auth_client(self.create_user("plain.audit@test.local"))
        response = plain.get("/api/TdrSt/auditeur/documents/")
        self.assertEqual(response.status_code, 403)

    def test_auditeur_sees_only_terminal_states(self):
        doc_id = self.client_demandeur.post(
            "/api/TdrSt/documents/", _payload(), format="json"
        ).json()["id"]
        self.client_demandeur.post(f"/api/TdrSt/documents/{doc_id}/submit/")

        response = self.client_auditeur.get("/api/TdrSt/auditeur/documents/")

        self.assertEqual(response.status_code, 200)
        ids = [item["id"] for item in response.json()]
        self.assertNotIn(doc_id, ids)

    def test_auditeur_sees_validated_document(self):
        tech = self.create_user("audit.tech@test.local", groups=[TECH_GROUP])
        final = self.create_user("audit.final@test.local", groups=[FINAL_GROUP])
        doc_id = self.client_demandeur.post(
            "/api/TdrSt/documents/", _payload(), format="json"
        ).json()["id"]
        self.client_demandeur.post(f"/api/TdrSt/documents/{doc_id}/submit/")
        self.auth_client(tech).post(
            f"/api/TdrSt/validations/tech/{doc_id}/decision/",
            {"decision": "FAVORABLE"},
            format="json",
        )
        self.auth_client(final).post(
            f"/api/TdrSt/validations/final/{doc_id}/decision/",
            {"decision": "APPROUVE"},
            format="json",
        )

        response = self.client_auditeur.get("/api/TdrSt/auditeur/documents/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(doc_id, [item["id"] for item in response.json()])


class TdrStDashboardTests(UCPAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = self.create_user("dashboard.tdrst@test.local")
        self.client = self.auth_client(self.user)

    @patch.object(DashboardAPIView, "calculate_avg_validation_delay", return_value=3.5)
    def test_dashboard_requires_auth(self, _mock):
        response = self.unauth_client().get("/api/TdrSt/dashboard/")
        self.assertEqual(response.status_code, 401)

    @patch.object(DashboardAPIView, "calculate_avg_validation_delay", return_value=3.5)
    def test_dashboard_returns_stats(self, _mock):
        demandeur_client = self.auth_client(
            self.create_user("dash.demandeur@test.local")
        )
        demandeur_client.post("/api/TdrSt/documents/", _payload(), format="json")

        response = self.client.get("/api/TdrSt/dashboard/")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["totalDocumentsYear"], 1)
        self.assertIn("monthlyDocuments", data)
        self.assertIn("documentsByType", data)
        self.assertIn("kpis", data)
        self.assertEqual(data["kpis"]["avgDelay"]["value"], 3.5)
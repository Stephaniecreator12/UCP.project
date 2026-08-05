"""Integration tests for the procurement (markets) API endpoints."""

from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from apps.procurement.models.procurement_market import ProcurementMarket
from apps.procurement.models.technical_document import TechnicalDocument
from apps.procurement.models.annex_document import AnnexDocument
from testsupport import UCPAPITestCase


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


class ProcurementMarketCRUDTests(UCPAPITestCase):
    def setUp(self):
        super().setUp()
        self.group = self.create_group("AGENT MARCHE")
        self.user = self.create_user("marcher@test.local", groups=["AGENT MARCHE"])
        self.client = self.auth_client(self.user)
        self.now = timezone.now()

    def _market_payload(self, **overrides):
        payload = {
            "title": "Acquisition de réactifs",
            "procedure_type": "AOI",
            "category": "BIENS",
            "financing_sources": ["FM"],
            "project_code": "PRJ-2026-001",
            "publication_date": iso(self.now),
            "deadline": iso(self.now + timedelta(days=30)),
        }
        payload.update(overrides)
        return payload

    def _create_market(self, **overrides):
        self.grant_model_permissions(
            self.group, "procurement", "procurementmarket",
            ["view", "add", "change", "delete"],
        )
        return self.client.post(
            "/api/procurement/markets/",
            self._market_payload(**overrides),
            format="json",
        )

    def test_create_market_without_permission_returns_403(self):
        response = self.client.post(
            "/api/procurement/markets/",
            self._market_payload(),
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_create_market_generates_reference(self):
        response = self._create_market()
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data["reference_number"].startswith("UCP/DAO/"))
        self.assertEqual(ProcurementMarket.objects.count(), 1)

    def test_create_market_requires_publication_date(self):
        payload = self._market_payload()
        del payload["publication_date"]
        self.grant_model_permissions(
            self.group, "procurement", "procurementmarket", ["view", "add"]
        )
        response = self.client.post(
            "/api/procurement/markets/", payload, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("publication_date", response.json())

    def test_create_market_deadline_before_publication_returns_400(self):
        payload = self._market_payload(deadline=iso(self.now - timedelta(days=1)))
        self.grant_model_permissions(
            self.group, "procurement", "procurementmarket", ["view", "add"]
        )
        response = self.client.post(
            "/api/procurement/markets/", payload, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("deadline", response.json())

    def test_create_aoi_requires_min_15_days(self):
        payload = self._market_payload(deadline=iso(self.now + timedelta(days=5)))
        self.grant_model_permissions(
            self.group, "procurement", "procurementmarket", ["view", "add"]
        )
        response = self.client.post(
            "/api/procurement/markets/", payload, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("deadline", response.json())

    def test_create_market_multiple_sources_require_bailleur(self):
        payload = self._market_payload(financing_sources=["FM", "BM"])
        self.grant_model_permissions(
            self.group, "procurement", "procurementmarket", ["view", "add"]
        )
        response = self.client.post(
            "/api/procurement/markets/", payload, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("reference_bailleur", response.json())

    def test_create_market_multiple_sources_with_bailleur_ok(self):
        payload = self._market_payload(
            financing_sources=["FM", "BM"], reference_bailleur="FM"
        )
        self.grant_model_permissions(
            self.group, "procurement", "procurementmarket", ["view", "add"]
        )
        response = self.client.post(
            "/api/procurement/markets/", payload, format="json"
        )
        self.assertEqual(response.status_code, 201)

    def test_create_market_requires_project_code_when_financed(self):
        payload = self._market_payload()
        del payload["project_code"]
        self.grant_model_permissions(
            self.group, "procurement", "procurementmarket", ["view", "add"]
        )
        response = self.client.post(
            "/api/procurement/markets/", payload, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("project_code", response.json())

    def test_services_category_requires_dates_atelier(self):
        payload = self._market_payload(
            category="SERVICES", procedure_type="DC",
            deadline=iso(self.now + timedelta(days=15)),
        )
        self.grant_model_permissions(
            self.group, "procurement", "procurementmarket", ["view", "add"]
        )
        response = self.client.post(
            "/api/procurement/markets/", payload, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("dates_atelier", response.json())

    def test_services_category_with_dates_atelier_ok(self):
        payload = self._market_payload(
            category="SERVICES", procedure_type="DC",
            deadline=iso(self.now + timedelta(days=15)),
            dates_atelier=[iso(self.now + timedelta(days=10))],
        )
        self.grant_model_permissions(
            self.group, "procurement", "procurementmarket", ["view", "add"]
        )
        response = self.client.post(
            "/api/procurement/markets/", payload, format="json"
        )
        self.assertEqual(response.status_code, 201)
        market = ProcurementMarket.objects.first()
        self.assertEqual(market.dates_previsionnelles.count(), 1)

    def test_update_market(self):
        market = self._create_market().json()
        payload = self._market_payload(title="Titre mis à jour")
        response = self.client.patch(
            f"/api/procurement/markets/{market['id']}/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            ProcurementMarket.objects.get(id=market["id"]).title,
            "Titre mis à jour",
        )

    def test_delete_market(self):
        market = self._create_market().json()
        response = self.client.delete(f"/api/procurement/markets/{market['id']}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(ProcurementMarket.objects.filter(id=market["id"]).exists())

    def test_detail_market(self):
        market = self._create_market().json()
        response = self.client.get(f"/api/procurement/markets/{market['id']}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], market["id"])


class ProcurementMarketListTests(UCPAPITestCase):
    def setUp(self):
        super().setUp()
        self.group = self.create_group("AGENT MARCHE")
        self.user = self.create_user("listeur@test.local", groups=["AGENT MARCHE"])
        self.client = self.auth_client(self.user)
        self.grant_model_permissions(
            self.group, "procurement", "procurementmarket", ["view", "add"]
        )
        self.now = timezone.now()

    def _create(self, title="Marché de test"):
        return ProcurementMarket.objects.create(
            title=title,
            procedure_type="AOI",
            category="BIENS",
            financing_sources=["FM"],
            project_code="PRJ-2026-001",
            publication_date=self.now,
            deadline=self.now + timedelta(days=30),
        )

    def test_market_list_requires_view_permission(self):
        other = self.create_user("noview@test.local")
        client = self.auth_client(other)
        response = client.get("/api/procurement/market-list/")
        self.assertEqual(response.status_code, 403)

    def test_market_list_returns_paginated_markets(self):
        self._create()
        response = self.client.get("/api/procurement/market-list/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["results"][0]["title"], "Marché de test")

    def test_market_list_search_by_title(self):
        self._create(title="Reagents")
        self._create(title="Vaccins")
        response = self.client.get("/api/procurement/market-list/", {"search": "Vaccins"})
        self.assertEqual(response.status_code, 200)
        results = response.json()["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Vaccins")


class TechnicalDocumentTests(UCPAPITestCase):
    def setUp(self):
        super().setUp()
        self.group = self.create_group("AGENT MARCHE")
        self.user = self.create_user("doc@test.local", groups=["AGENT MARCHE"])
        self.client = self.auth_client(self.user)
        self.grant_model_permissions(
            self.group, "procurement", "procurementmarket", ["view", "add"]
        )
        self.grant_model_permissions(
            self.group, "procurement", "technicaldocument", ["view", "add"]
        )
        self.now = timezone.now()
        self.market = ProcurementMarket.objects.create(
            title="DAO technique",
            procedure_type="AOI",
            category="BIENS",
            financing_sources=["FM"],
            project_code="PRJ-2026-001",
            publication_date=self.now,
            deadline=self.now + timedelta(days=30),
        )

    def _pdf(self, name="cahier.pdf"):
        return SimpleUploadedFile(name, b"%PDF-1.4 test", content_type="application/pdf")

    def test_upload_technical_document_assigns_version_1(self):
        response = self.client.post(
            "/api/procurement/technical-documents/",
            {"market": self.market.id, "file": self._pdf()},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["version"], 1)

    def test_upload_second_version_increments_version(self):
        self.client.post(
            "/api/procurement/technical-documents/",
            {"market": self.market.id, "file": self._pdf()},
            format="multipart",
        )
        response = self.client.post(
            "/api/procurement/technical-documents/",
            {"market": self.market.id, "file": self._pdf()},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["version"], 2)

    def test_rejects_non_pdf(self):
        bad = SimpleUploadedFile("spec.docx", b"docx", content_type="application/pdf")
        response = self.client.post(
            "/api/procurement/technical-documents/",
            {"market": self.market.id, "file": bad},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)

    def test_market_serializer_exposes_technical_documents(self):
        self.client.post(
            "/api/procurement/technical-documents/",
            {"market": self.market.id, "file": self._pdf()},
            format="multipart",
        )
        response = self.client.get(f"/api/procurement/markets/{self.market.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["technical_documents"]), 1)


class AnnexDocumentTests(UCPAPITestCase):
    def setUp(self):
        super().setUp()
        self.group = self.create_group("AGENT MARCHE")
        self.user = self.create_user("annexes@test.local", groups=["AGENT MARCHE"])
        self.client = self.auth_client(self.user)
        self.grant_model_permissions(
            self.group, "procurement", "procurementmarket", ["view", "add"]
        )
        self.grant_model_permissions(
            self.group, "procurement", "annexdocument", ["view", "add"]
        )
        self.now = timezone.now()
        self.market = ProcurementMarket.objects.create(
            title="Marché avec annexes",
            procedure_type="AOI",
            category="BIENS",
            financing_sources=["FM"],
            project_code="PRJ-2026-001",
            publication_date=self.now,
            deadline=self.now + timedelta(days=30),
        )

    def _upload(self):
        f = SimpleUploadedFile("annexe.pdf", b"%PDF annexe", content_type="application/pdf")
        return self.client.post(
            "/api/procurement/annexes/",
            {"market": self.market.id, "file": f},
            format="multipart",
        )

    def test_upload_annex(self):
        response = self._upload()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(AnnexDocument.objects.count(), 1)

    def test_max_five_annexes(self):
        for _ in range(5):
            self._upload()
        response = self._upload()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(AnnexDocument.objects.count(), 5)

    def test_market_serializer_exposes_annexes(self):
        self._upload()
        response = self.client.get(f"/api/procurement/markets/{self.market.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["annexes"]), 1)


class DownloadDAOTests(UCPAPITestCase):
    def setUp(self):
        super().setUp()
        self.group = self.create_group("AGENT MARCHE")
        self.user = self.create_user("dao@test.local", groups=["AGENT MARCHE"])
        self.client = self.auth_client(self.user)
        self.grant_model_permissions(
            self.group, "procurement", "procurementmarket", ["view", "add", "change"]
        )
        self.now = timezone.now()
        self.market = ProcurementMarket.objects.create(
            title="Marché DAO",
            procedure_type="AOI",
            category="BIENS",
            financing_sources=["FM"],
            project_code="PRJ-2026-001",
            publication_date=self.now,
            deadline=self.now + timedelta(days=30),
            submission_model=SimpleUploadedFile(
                "model.docx", b"docx content",
                content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ),
        )

    def test_download_dao_returns_file(self):
        reference = self.market.reference_number.replace("/", "/")
        url = f"/market/{reference}/download-dao/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "application/vnd.openxmlformats-officedocument",
            response["Content-Type"],
        )

    def test_download_dao_requires_permission(self):
        other = self.create_user("nodao@test.local")
        client = self.auth_client(other)
        response = client.get(f"/market/{self.market.reference_number}/download-dao/")
        self.assertEqual(response.status_code, 403)

    def test_download_dao_without_model_returns_404(self):
        self.market.submission_model.delete(save=False)
        self.market.submission_model = None
        self.market.save()
        response = self.client.get(f"/market/{self.market.reference_number}/download-dao/")
        self.assertEqual(response.status_code, 404)
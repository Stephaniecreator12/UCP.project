"""Integration tests for the PPM (planification) API endpoints."""

from apps.ppm.models.Travaux import Travaux
from apps.ppm.models.Biens import Biens
from apps.ppm.models.Consultances import Consultance
from testsupport import DIALOGUE_PASSWORD, UCPAPITestCase


class TravauxAPITests(UCPAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = self.create_user("ppm.travaux@test.local")

    def _add(self, intitule="Construction route RN7"):
        return self.unauth_client().post(
            "/api/ppm/travaux/add/",
            {"intitule": intitule, "montant_estimatif": 250000000},
            format="json",
        )

    def test_add_travaux_is_allow_any_and_returns_201(self):
        response = self._add()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], "success")
        self.assertTrue(Travaux.objects.filter(id=response.json()["id"]).exists())

    def test_add_travaux_applies_defaults(self):
        response = self._add()
        obj = Travaux.objects.get(id=response.json()["id"])
        self.assertEqual(obj.statut, "En cours")
        self.assertEqual(obj.methode_pm, "Appel d'offres")

    def test_add_travaux_invalid_json_returns_400(self):
        response = self.unauth_client().post(
            "/api/ppm/travaux/add/",
            data="not-json",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_list_travaux_returns_created_items(self):
        self._add(intitule="Pont sur le fleuve")
        response = self.unauth_client().get("/api/ppm/travaux/list/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()["travaux"]
        self.assertTrue(any(item["intitule"] == "Pont sur le fleuve" for item in payload))

    def test_update_travaux_modifies_fields(self):
        obj_id = self._add().json()["id"]
        response = self.unauth_client().put(
            f"/api/ppm/travaux/update/{obj_id}/",
            {"intitule": "Intitule modifie"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Travaux.objects.get(id=obj_id).intitule, "Intitule modifie")

    def test_planning_travaux_requires_auth(self):
        response = self.unauth_client().post(
            "/api/ppm/travaux/planning/",
            {"date_livr": "2026-12-31"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_planning_travaux_computes_dates(self):
        client = self.auth_client(self.user)
        response = client.post(
            "/api/ppm/travaux/planning/",
            {"date_livr": "2026-12-31", "methode": "AOI", "duree": 60},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        dates = response.json()
        self.assertEqual(dates["date_livraison_prevu"], "2026-12-31")
        self.assertEqual(dates["date_signature_prevu"], "2026-11-01")
        self.assertIn("dossiers_appel_prevu", dates)

    def test_status_travaux_requires_auth(self):
        response = self.unauth_client().post(
            "/api/ppm/travaux/status/",
            {"dates_prevues": {}, "dates_reels": {}},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_status_travaux_returns_statut(self):
        client = self.auth_client(self.user)
        prevues = {
            "dossiers_appel_prevu": "2026-01-01",
            "date_lancement_prevu": "2027-03-01",
        }
        reels = {"dossiers_appel_reel": "2026-01-02"}
        response = client.post(
            "/api/ppm/travaux/status/",
            {"dates_prevues": prevues, "dates_reels": reels},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["statut"], "En cours (dans les temps)")

    def test_delete_travaux_requires_auth(self):
        obj_id = self._add().json()["id"]
        response = self.unauth_client().delete(f"/api/ppm/travaux/delete/{obj_id}/")
        self.assertEqual(response.status_code, 401)

    def test_delete_travaux_requires_password(self):
        client = self.auth_client(self.user)
        obj_id = self._add().json()["id"]
        response = client.delete(f"/api/ppm/travaux/delete/{obj_id}/", format="json")
        self.assertEqual(response.status_code, 400)

    def test_delete_travaux_wrong_password(self):
        client = self.auth_client(self.user)
        obj_id = self._add().json()["id"]
        response = client.delete(
            f"/api/ppm/travaux/delete/{obj_id}/",
            {"password": "WrongPassword99!"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_delete_travaux_with_correct_password(self):
        client = self.auth_client(self.user)
        obj_id = self._add().json()["id"]
        response = client.delete(
            f"/api/ppm/travaux/delete/{obj_id}/",
            {"password": DIALOGUE_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Travaux.objects.filter(id=obj_id).exists())

    def test_arreter_travaux_requires_auth(self):
        obj_id = self._add().json()["id"]
        response = self.unauth_client().post(f"/api/ppm/travaux/arreter/{obj_id}/")
        self.assertEqual(response.status_code, 401)

    def test_arreter_travaux_sets_statut(self):
        client = self.auth_client(self.user)
        obj_id = self._add().json()["id"]
        response = client.post(f"/api/ppm/travaux/arreter/{obj_id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Travaux.objects.get(id=obj_id).statut, "Arrêté")

    def test_arreter_travaux_twice_returns_409(self):
        client = self.auth_client(self.user)
        obj_id = self._add().json()["id"]
        client.post(f"/api/ppm/travaux/arreter/{obj_id}/")
        response = client.post(f"/api/ppm/travaux/arreter/{obj_id}/")
        self.assertEqual(response.status_code, 409)

    def test_arreter_missing_travaux_returns_404(self):
        client = self.auth_client(self.user)
        response = client.post("/api/ppm/travaux/arreter/999999/")
        self.assertEqual(response.status_code, 404)


class BiensAPITests(UCPAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = self.create_user("ppm.biens@test.local")

    def _add(self, intitule="Ordinateurs portables"):
        return self.unauth_client().post(
            "/api/ppm/biens/add/",
            {"intitule": intitule, "montant_estimatif": 45000000},
            format="json",
        )

    def test_add_biens_is_allow_any(self):
        response = self._add()
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Biens.objects.filter(id=response.json()["id"]).exists())

    def test_list_biens_returns_items(self):
        self._add()
        response = self.unauth_client().get("/api/ppm/biens/list/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("biens", response.json())

    def test_update_biens(self):
        obj_id = self._add().json()["id"]
        response = self.unauth_client().patch(
            f"/api/ppm/biens/update/{obj_id}/",
            {"statut": "Terminé"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Biens.objects.get(id=obj_id).statut, "Terminé")

    def test_planning_biens(self):
        client = self.auth_client(self.user)
        response = client.post(
            "/api/ppm/biens/planning/",
            {"date_livr": "2026-10-15", "methode": "DC", "duree": 45},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["date_livraison_prevu"], "2026-10-15")

    def test_status_biens_requires_auth(self):
        response = self.unauth_client().post(
            "/api/ppm/biens/status/",
            {"dates_prevues": {}, "dates_reels": {}},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_delete_biens_with_password(self):
        client = self.auth_client(self.user)
        obj_id = self._add().json()["id"]
        response = client.delete(
            f"/api/ppm/biens/delete/{obj_id}/",
            {"password": DIALOGUE_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Biens.objects.filter(id=obj_id).exists())

    def test_arreter_biens(self):
        client = self.auth_client(self.user)
        obj_id = self._add().json()["id"]
        response = client.post(f"/api/ppm/biens/arreter/{obj_id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Biens.objects.get(id=obj_id).statut, "Arrêté")


class ConsultanceAPITests(UCPAPITestCase):
    def setUp(self):
        super().setUp()
        self.user = self.create_user("ppm.cons@test.local")

    def _add(self, intitule="Etude de faisabilite"):
        return self.unauth_client().post(
            "/api/ppm/consultances/add/",
            {"intitule": intitule, "montant_estimatif": 90000000},
            format="json",
        )

    def test_add_consultance_is_allow_any(self):
        response = self._add()
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Consultance.objects.filter(id=response.json()["id"]).exists())

    def test_list_consultance_returns_items(self):
        self._add(intitule="Audit financier")
        response = self.unauth_client().get("/api/ppm/consultances/list/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()["consultance"]
        self.assertTrue(any(item["intitule"] == "Audit financier" for item in payload))

    def test_update_consultance(self):
        obj_id = self._add().json()["id"]
        response = self.unauth_client().post(
            f"/api/ppm/consultances/update/{obj_id}/",
            {"methode": "SFQC"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Consultance.objects.get(id=obj_id).methode, "SFQC")

    def test_planning_consultance_uses_smc(self):
        client = self.auth_client(self.user)
        response = client.post(
            "/api/ppm/consultances/planning/",
            {"date_fin": "2026-12-01", "methode": "SMC", "duree": 60},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        dates = response.json()
        self.assertEqual(dates["date_fin_prevu"], "2026-12-01")
        self.assertEqual(dates["date_signature_prevu"], "2026-10-02")

    def test_status_consultance(self):
        client = self.auth_client(self.user)
        prevues = {"TdR_prevu": "2026-01-01", "ami_prevu": "2027-02-01"}
        reels = {"TdR_reel": "2026-01-10"}
        response = client.post(
            "/api/ppm/consultances/status/",
            {"dates_prevues": prevues, "dates_reels": reels},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["statut"], "En cours (dans les temps)")

    def test_delete_consultance_with_password(self):
        client = self.auth_client(self.user)
        obj_id = self._add().json()["id"]
        response = client.delete(
            f"/api/ppm/consultances/delete/{obj_id}/",
            {"password": DIALOGUE_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Consultance.objects.filter(id=obj_id).exists())

    def test_arreter_consultance(self):
        client = self.auth_client(self.user)
        obj_id = self._add().json()["id"]
        response = client.post(f"/api/ppm/consultances/arreter/{obj_id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Consultance.objects.get(id=obj_id).statut, "Arrêté")
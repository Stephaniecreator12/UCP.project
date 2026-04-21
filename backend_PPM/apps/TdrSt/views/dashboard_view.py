from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from datetime import datetime
from django.db.models import Count, Q
from django.db.models.functions import ExtractMonth
from django.utils import timezone

from apps.TdrSt.models.TdrSt import TdrStDocument, TdrStValidationAction


class DashboardAPIView(APIView):
    """API endpoint pour récupérer les données du dashboard"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            stats = self.get_dashboard_stats()
            return Response(stats)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get_dashboard_stats(self):
        """Statistiques globales pour le dashboard"""
        now = timezone.now()
        current_year = now.year
        current_month = now.month

        # Documents de l'année en cours
        docs_year = TdrStDocument.objects.filter(created_at__year=current_year)

        # 1. Total documents année
        total_documents_year = docs_year.count()

        # 2. Taux de validation
        validated_count = TdrStDocument.objects.filter(statut=TdrStDocument.Statut.VALIDE).count()
        total_documents = TdrStDocument.objects.count()
        validation_rate = validated_count / total_documents if total_documents > 0 else 0

        # 3. Sources de financement uniques
        financement_sources_count = self.count_financement_sources()

        # 4. Documents par mois
        monthly_data = self.get_monthly_data(docs_year)

        # 5. Documents par type (TDR/ST)
        documents_by_type = self.get_documents_by_type()

        # 6. Documents par source
        documents_by_source = self.get_documents_by_source()

        # 7. KPIs
        kpis = self.get_kpis(current_year, current_month)

        return {
            "totalDocumentsYear": total_documents_year,
            "validationRate": round(validation_rate, 3),
            "financementSourcesCount": financement_sources_count,
            "monthlyDocuments": monthly_data,
            "documentsByType": documents_by_type,
            "documentsBySource": documents_by_source,
            "kpis": kpis,
        }

    def count_financement_sources(self):
        sources_set = set()
        valid_sources = ["Fonds mondial", "Banque mondiale", "Alliance GAVI"]
        
        for doc in TdrStDocument.objects.exclude(sources_financement=[]):
            sources = doc.sources_financement
            
            if isinstance(sources, str):
                sources = [sources] if sources else []
            
            for source in sources:
                if isinstance(source, str) and source in valid_sources:
                    sources_set.add(source)
                elif isinstance(source, dict) and "nom" in source:
                    if source["nom"] in valid_sources:
                        sources_set.add(source["nom"])
        return len(sources_set)

    def get_monthly_data(self, docs_year):
        monthly_documents = list(
            docs_year
            .annotate(month=ExtractMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        
        month_names = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"]
        monthly_data = []
        for month_num in range(1, 13):
            found = next((m for m in monthly_documents if m["month"] == month_num), None)
            monthly_data.append({
                "month": month_names[month_num - 1],
                "count": found["count"] if found else 0,
            })
        return monthly_data

    def get_documents_by_type(self):
        tdr_count = TdrStDocument.objects.filter(type_document="TDR").count()
        st_count = TdrStDocument.objects.filter(type_document="ST").count()
        return [
            {"name": "TDR", "value": tdr_count, "color": "#22c55e"},
            {"name": "ST", "value": st_count, "color": "#0ea5e9"},
        ]

    def get_documents_by_source(self):
        from collections import Counter
        source_counter = Counter()
        
        valid_sources = ["Fonds mondial", "Banque mondiale", "Alliance GAVI"]
        
        for doc in TdrStDocument.objects.exclude(sources_financement=[]):
            sources = doc.sources_financement
            
            # Si c'est une string (radio button), la mettre dans un tableau
            if isinstance(sources, str):
                sources = [sources] if sources else []
            
            for source in sources:
                if isinstance(source, str):
                    if source in valid_sources:
                        source_counter[source] += 1
                elif isinstance(source, dict) and "nom" in source:
                    if source["nom"] in valid_sources:
                        source_counter[source["nom"]] += 1
        
        documents_by_source = [
            {"source": source, "documents": count, "fullMark": 0}
            for source, count in source_counter.most_common(6)
        ]
        
        if documents_by_source:
            max_docs = max(d["documents"] for d in documents_by_source)
            full_mark = ((max_docs // 10) + 1) * 10 if max_docs > 0 else 10
            for item in documents_by_source:
                item["fullMark"] = full_mark
        
        return documents_by_source

    def get_kpis(self, current_year, current_month):
        # Mois précédent
        if current_month > 1:
            prev_year = current_year
            prev_month = current_month - 1
        else:
            prev_year = current_year - 1
            prev_month = 12

        # Documents du mois en cours
        current_month_docs = TdrStDocument.objects.filter(
            created_at__year=current_year,
            created_at__month=current_month
        ).count()
        
        previous_month_docs = TdrStDocument.objects.filter(
            created_at__year=prev_year,
            created_at__month=prev_month
        ).count()
        
        current_month_trend = (
            int(((current_month_docs - previous_month_docs) / previous_month_docs * 100))
            if previous_month_docs > 0 else 0
        )
        
        # Délai moyen
        avg_delay = self.calculate_avg_validation_delay()
        
        # Documents validés ce mois
        validated_this_month = TdrStDocument.objects.filter(
            statut=TdrStDocument.Statut.VALIDE,
            updated_at__year=current_year,
            updated_at__month=current_month
        ).count()
        
        validated_prev_month = TdrStDocument.objects.filter(
            statut=TdrStDocument.Statut.VALIDE,
            updated_at__year=prev_year,
            updated_at__month=prev_month
        ).count()
        
        validated_trend = (
            int(((validated_this_month - validated_prev_month) / validated_prev_month * 100))
            if validated_prev_month > 0 else 0
        )
        
        # Documents en attente
        pending_count = TdrStDocument.objects.filter(
            statut__in=[
                TdrStDocument.Statut.SOUMIS,
                TdrStDocument.Statut.EN_VALIDATION,
                TdrStDocument.Statut.EN_ATTENTE_ANO,
            ]
        ).count()
        
        pending_prev_month = TdrStDocument.objects.filter(
            statut__in=[
                TdrStDocument.Statut.SOUMIS,
                TdrStDocument.Statut.EN_VALIDATION,
                TdrStDocument.Statut.EN_ATTENTE_ANO,
            ],
            created_at__year=prev_year,
            created_at__month=prev_month
        ).count()
        
        pending_trend = (
            int(((pending_count - pending_prev_month) / pending_prev_month * 100))
            if pending_prev_month > 0 else 0
        )
        
        return {
            "currentMonth": {"value": current_month_docs, "trend": current_month_trend},
            "avgDelay": {
                "value": round(avg_delay, 1) if avg_delay else 0,
                "unit": "jours",
                "trend": 0,
                "warningThreshold": 5,
                "dangerThreshold": 7,
            },
            "validated": {"value": validated_this_month, "trend": validated_trend},
            "pending": {"value": pending_count, "trend": pending_trend},
        }

    def calculate_avg_validation_delay(self):
        from django.db import connection
        
        query = """
        SELECT AVG(EXTRACT(EPOCH FROM (final.horodatage - depot.horodatage)) / 86400.0)
        FROM tdr_st_validation_action depot
        INNER JOIN tdr_st_validation_action final ON depot.document_id = final.document_id
        WHERE depot.etape = 'DEPOT'
          AND final.etape IN ('APPROBATION_FINALE', 'ANO')
          AND final.decision IN ('APPROUVE', 'ANO_ACCORDE')
          AND depot.horodatage < final.horodatage
        """
        
        with connection.cursor() as cursor:
            cursor.execute(query)
            result = cursor.fetchone()
            return float(result[0]) if result and result[0] else None
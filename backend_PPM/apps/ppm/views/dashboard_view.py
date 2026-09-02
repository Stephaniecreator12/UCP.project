from collections import defaultdict
from decimal import Decimal

from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render

from apps.ppm.models.Biens import Biens
from apps.ppm.models.Consultances import Consultance
from apps.ppm.models.Travaux import Travaux


def _get_agmo(instance):
    return getattr(instance, "agmo", None) or getattr(instance, "agmoxdirection", None) or ""


def _normalize_rows(qs, model_type):
    for obj in qs.iterator():
        yield {
            "bailleur": (obj.reference_bailleur or "").strip() or "\u2014",
            "agmo": (_get_agmo(obj) or "").strip() or "\u2014",
            "statut": (obj.statut or "").strip() or "Non d\u00e9fini",
            "model_type": model_type,
            "montant": obj.montant_estimatif or Decimal("0"),
        }


def _apply_filters(qs, model_type, filters):
    bailleur = filters.get("bailleur", "").strip()
    agmo = filters.get("agmo", "").strip()
    statut = filters.get("statut", "").strip()
    model_type_filter = filters.get("model_type", "").strip()

    if model_type_filter and model_type_filter != model_type:
        return qs.none()

    if bailleur:
        qs = qs.filter(reference_bailleur=bailleur)

    if agmo:
        if model_type == "consultants":
            qs = qs.filter(agmoxdirection__icontains=agmo)
        else:
            qs = qs.filter(agmo__icontains=agmo)

    if statut:
        qs = qs.filter(statut__icontains=statut)

    return qs


def _fmt(value):
    return f"{value:,.2f}".replace(",", " ")


def _aggregate(rows):
    by_bailleur = defaultdict(lambda: {"count": 0, "total": Decimal("0")})
    by_agmo = defaultdict(lambda: {"count": 0, "total": Decimal("0")})
    by_statut = defaultdict(lambda: {"count": 0})
    by_model = defaultdict(lambda: {"count": 0, "total": Decimal("0")})

    for r in rows:
        by_bailleur[r["bailleur"]]["count"] += 1
        by_bailleur[r["bailleur"]]["total"] += r["montant"]

        by_agmo[r["agmo"]]["count"] += 1
        by_agmo[r["agmo"]]["total"] += r["montant"]

        by_statut[r["statut"]]["count"] += 1

        by_model[r["model_type"]]["count"] += 1
        by_model[r["model_type"]]["total"] += r["montant"]

    def _format_dict(d):
        return [
            (name, {"count": data["count"], "formatted": _fmt(data["total"])})
            for name, data in sorted(d.items(), key=lambda x: (-x[1]["count"], x[0]))
        ]

    def _format_dict_no_amount(d):
        return [
            (name, {"count": data["count"]})
            for name, data in sorted(d.items(), key=lambda x: (-x[1]["count"], x[0]))
        ]

    return (
        _format_dict(by_bailleur),
        _format_dict(by_agmo),
        _format_dict_no_amount(by_statut),
        _format_dict(by_model),
    )


def _available_values(field_name):
    values = set()
    for model in (Travaux, Biens, Consultance):
        db_field = "agmoxdirection" if (field_name == "agmo" and model is Consultance) else field_name
        vals = (
            model.objects.exclude(**{db_field: ""})
            .exclude(**{db_field: None})
            .values_list(db_field, flat=True)
            .distinct()
        )
        values.update(v.strip() for v in vals if v and v.strip())
    return sorted(values)


@staff_member_required
def ppm_dashboard_view(request):
    filters = {
        "bailleur": request.GET.get("bailleur", ""),
        "agmo": request.GET.get("agmo", ""),
        "statut": request.GET.get("statut", ""),
        "model_type": request.GET.get("model_type", ""),
    }

    bailleurs = _available_values("reference_bailleur")
    agmos = _available_values("agmo")
    statuts = _available_values("statut")

    t_qs = _apply_filters(Travaux.objects.all(), "travaux", filters)
    b_qs = _apply_filters(Biens.objects.all(), "biens", filters)
    c_qs = _apply_filters(Consultance.objects.all(), "consultants", filters)

    all_rows = (
        list(_normalize_rows(t_qs, "travaux"))
        + list(_normalize_rows(b_qs, "biens"))
        + list(_normalize_rows(c_qs, "consultants"))
    )

    by_bailleur, by_agmo, by_statut, by_model = _aggregate(all_rows)

    total_count = len(all_rows)
    total_amount = _fmt(sum(r["montant"] for r in all_rows))

    context = {
        "filters": filters,
        "available_bailleurs": bailleurs,
        "available_agmos": agmos,
        "available_statuts": statuts,
        "total_count": total_count,
        "total_amount": total_amount,
        "by_bailleur": by_bailleur,
        "by_agmo": by_agmo,
        "by_statut": by_statut,
        "by_model": by_model,
        "title": "Tableau de bord PPM",
    }
    return render(request, "admin/ppm/dashboard.html", context)

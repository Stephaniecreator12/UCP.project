import hashlib
from io import BytesIO
from xml.sax.saxutils import escape

from django.core.files.base import ContentFile
from django.utils import timezone

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from apps.evaluation_offre.models import EvaluationReport


def _pdf_text(value, fallback="-"):
    text = str(value or "").strip()
    return escape(text or fallback)


def _format_datetime(value, fallback="-"):
    if not value:
        return fallback
    try:
        value = timezone.localtime(value)
    except ValueError:
        pass
    return value.strftime("%d/%m/%Y %H:%M")


def generate_and_archive_evaluation_report(decision):
    # decision : DecisionFinale
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16, leading=20, alignment=1)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=13)
    bold_style = ParagraphStyle('Bold', parent=body_style, fontName='Helvetica-Bold')

    story.append(Paragraph("RAPPORT D'ÉVALUATION CONSOLIDÉ", title_style))
    date_gen = timezone.now().strftime("%d/%m/%Y %H:%M")
    story.append(Paragraph(f"Généré le {date_gen}", body_style))
    story.append(Spacer(1, 12))

    # Header info
    offre = decision.offre
    seance = getattr(offre, 'seance', None)
    general = [
        [Paragraph("Référence :", bold_style), Paragraph(seance.reference_dossier if seance else "-", body_style)],
        [Paragraph("Objet :", bold_style), Paragraph(seance.objet_dossier if seance else "-", body_style)],
        [Paragraph("Soumissionnaire :", bold_style), Paragraph(offre.nom_soumissionnaire or "-", body_style)],
    ]
    t = Table(general, colWidths=[120, 360])
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP')]))
    story.append(t)
    story.append(Spacer(1, 10))

    # Scores
    story.append(Paragraph("Scores consolidés", bold_style))
    scores_table = [
        [Paragraph("Score technique (moyenne)", body_style), Paragraph(str(decision.score_technique_consolide or "-"), body_style)],
        [Paragraph("Score financier (moyenne)", body_style), Paragraph(str(decision.score_financier_consolide or "-"), body_style)],
        [Paragraph("Score final", body_style), Paragraph(str(decision.score_final or "-"), body_style)],
        [Paragraph("Classement", body_style), Paragraph(str(decision.classement or "-"), body_style)],
        [Paragraph("Recommandation", body_style), Paragraph(str(decision.recommandation or "-"), body_style)],
    ]
    t2 = Table(scores_table, colWidths=[200, 280])
    t2.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'), ('BOTTOMPADDING',(0,0),(-1,-1),6)]))
    story.append(t2)
    story.append(Spacer(1, 12))

    # Detail par évaluateur
    story.append(Paragraph("Détails évaluateurs", bold_style))
    header = [Paragraph("Evaluateur", bold_style), Paragraph("Tech /100", bold_style), Paragraph("Financier", bold_style), Paragraph("Conclusion", bold_style)]
    rows = [header]
    for eval_obj in offre.evaluations.select_related('evaluateur').all():
        try:
            tech = eval_obj.evaluation_technique
            fin = eval_obj.evaluation_financiere
            tech_score = str(tech.score_technique_total or "-")
            fin_score = str(fin.score_financier or "-")
        except Exception:
            tech_score = "-"
            fin_score = "-"
        rows.append([Paragraph(eval_obj.evaluateur_nom_prenom or eval_obj.evaluateur.username, body_style), Paragraph(tech_score, body_style), Paragraph(fin_score, body_style), Paragraph(eval_obj.statut or "-", body_style)])
    table_ev = Table(rows, colWidths=[220, 80, 80, 100])
    table_ev.setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.5,colors.HexColor('#cbd5e1')), ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, colors.HexColor('#f8fafc')])]))
    story.append(table_ev)
    story.append(Spacer(1, 12))

    # Justification
    story.append(Paragraph("Justification:", bold_style))
    story.append(Paragraph(decision.justification or "-", body_style))
    story.append(Spacer(1, 8))

    # Signatures
    story.append(Paragraph("Signé par le président :", bold_style))
    story.append(Paragraph(seance.president.get_full_name() if seance and seance.president else "-", body_style))

    # Build PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    sha256_hash = hashlib.sha256(pdf_bytes).hexdigest()
    buffer.close()

    filename = f"Evaluation_Report_{seance.reference_dossier if seance else 'unknown'}_{offre.id}.pdf"
    report_obj, created = EvaluationReport.objects.get_or_create(decision=decision)
    report_obj.fichier.save(filename, ContentFile(pdf_bytes), save=False)
    report_obj.hash_document = sha256_hash
    report_obj.save()
    return report_obj

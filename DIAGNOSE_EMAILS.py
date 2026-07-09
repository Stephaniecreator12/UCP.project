#!/usr/bin/env python3
"""
Script de diagnostic pour vérifier la config des emails

Exécution:
    cd backend_PPM
    python3 manage.py shell < ../DIAGNOSE_EMAILS.py
"""

from django.conf import settings
import inspect

print("=" * 80)
print("DIAGNOSTIC: CONFIG DES EMAILS - UCP e-Procurement")
print("=" * 80)

# ============================================================
# 1. EMAIL CONFIG
# ============================================================
print("\n[1] EMAIL BACKEND CONFIGURATION")
print(f"  EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"  EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"  EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"  EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"  EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")
print(f"  EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"  DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

# ============================================================
# 2. FRONTEND URL
# ============================================================
print("\n[2] FRONTEND URL")
print(f"  FRONTEND_APP_URL: {settings.FRONTEND_APP_URL}")

# ============================================================
# 3. OUVERTURE OFFRE
# ============================================================
print("\n[3] OUVERTURE_OFFRE NOTIFICATIONS")
print(
    f"  OUVERTURE_NOTIFICATION_EMAILS_ENABLED: "
    f"{getattr(settings, 'OUVERTURE_NOTIFICATION_EMAILS_ENABLED', 'NOT_FOUND')} "
    f"({'✅' if getattr(settings, 'OUVERTURE_NOTIFICATION_EMAILS_ENABLED', False) else '❌'})"
)
print(
    f"  OUVERTURE_EMAIL_SUBJECT_PREFIX: {getattr(settings, 'OUVERTURE_EMAIL_SUBJECT_PREFIX', 'NOT_FOUND')}"
)

# ============================================================
# 4. EVALUATION OFFRE
# ============================================================
print("\n[4] EVALUATION_OFFRE NOTIFICATIONS")
print(
    f"  EVALUATION_NOTIFICATION_EMAILS_ENABLED: "
    f"{getattr(settings, 'EVALUATION_NOTIFICATION_EMAILS_ENABLED', 'NOT_FOUND')} "
    f"({'✅' if getattr(settings, 'EVALUATION_NOTIFICATION_EMAILS_ENABLED', False) else '❌'})"
)
print(
    f"  EVALUATION_EMAIL_SUBJECT_PREFIX: {getattr(settings, 'EVALUATION_EMAIL_SUBJECT_PREFIX', 'NOT_FOUND')}"
)

# ============================================================
# 5. VÉRIFIER LES FONCTIONS NOTIFICATION
# ============================================================
print("\n[5] NOTIFICATION FUNCTIONS")

# Ouverture Offre
try:
    from apps.ouverture_offre.services.notification_service import (
        notify_members_validation_requested,
        notify_president_validation_requested,
    )

    print("  ✅ notify_members_validation_requested (imported)")
    print("  ✅ notify_president_validation_requested (imported)")
except ImportError as e:
    print(f"  ❌ Import error: {e}")

# Evaluation Offre
try:
    from apps.evaluation_offre.services.evaluation_service import (
        _notify_evaluateurs_assignment,
        _notify_evaluateurs_seance_assignment,
    )

    print("  ✅ _notify_evaluateurs_assignment (imported)")
    print("  ✅ _notify_evaluateurs_seance_assignment (imported)")
except ImportError as e:
    print(f"  ❌ Import error: {e}")

# ============================================================
# 6. VÉRIFIER LES TEMPLATES
# ============================================================
print("\n[6] EMAIL TEMPLATES")

import os

template_path = "apps/evaluation_offre/templates/emails/evaluation_assignment.html"
full_path = os.path.join(os.path.dirname(__file__), "backend_PPM", template_path)

if os.path.exists(template_path):
    print(f"  ✅ {template_path}")
else:
    print(f"  ❌ {template_path} NOT FOUND")

# ============================================================
# 7. RÉSUMÉ
# ============================================================
print("\n" + "=" * 80)
print("RÉSUMÉ")
print("=" * 80)

checks = {
    "Email Backend SMTP": settings.EMAIL_BACKEND
    == "django.core.mail.backends.smtp.EmailBackend",
    "Email Host": bool(settings.EMAIL_HOST),
    "Email Port": bool(settings.EMAIL_PORT),
    "OUVERTURE enabled": getattr(settings, "OUVERTURE_NOTIFICATION_EMAILS_ENABLED", False),
    "EVALUATION enabled": getattr(settings, "EVALUATION_NOTIFICATION_EMAILS_ENABLED", False),
    "DEFAULT_FROM_EMAIL": bool(settings.DEFAULT_FROM_EMAIL),
}

passed = sum(1 for v in checks.values() if v)
total = len(checks)

for check_name, result in checks.items():
    status = "✅" if result else "❌"
    print(f"{status} {check_name}")

print(f"\n{passed}/{total} checks passed")
print("\n✅ All configs look good!" if passed == total else "\n⚠️ Some configs need attention!")

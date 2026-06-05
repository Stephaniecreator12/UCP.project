import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('backend_PPM')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()

app.conf.imports = (
    'apps.log.tasks.send_daily_ucp_report_task',
    'apps.log.tasks.operational_monitoring_task',
)
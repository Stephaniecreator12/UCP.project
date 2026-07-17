from django.urls import path

from apps.log.views.track_action_view import TrackActionView
from apps.log.views.view_count_view import ProcurementViewCountAPIView
from apps.log.views.annexe_ratio_view import AnnexeDownloadRatioAPIView
from apps.log.views.download_count_view import DAODownloadCountAPIView
from apps.log.views.individual_traceability_view import (
    IndividualTraceabilityAPIView,
)
from apps.log.views.operational_monitoring_view import (
    OperationalMonitoringAPIView,
)

urlpatterns = [
    path(
        "dao-downloads/",
        DAODownloadCountAPIView.as_view(),
        name="dao-downloads-count",
    ),
    path(
        "annexes-ratios/",
        AnnexeDownloadRatioAPIView.as_view(),
        name="annexes-download-ratios",
    ),
    path(
        "views-count/",
        ProcurementViewCountAPIView.as_view(),
        name="procurement-views-count",
    ),
    path(
        "monitoring/",
        OperationalMonitoringAPIView.as_view(),
        name="operational-monitoring",
    ),
    path(
        "track/",
        TrackActionView.as_view(),
        name="track-action",
    ),
    path(
        "individual/",
        IndividualTraceabilityAPIView.as_view(),
        name="individual-traceability",
    ),
]
from django.urls import path

from apps.dashboard.views import (
    DashboardAnalyticsView,
)


app_name = "dashboard"


urlpatterns = [
    path(
        "analytics/",
        DashboardAnalyticsView.as_view(),
        name="analytics",
    ),
]

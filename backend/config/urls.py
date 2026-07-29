from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "api/",
        include("apps.core.urls"),
    ),

    path(
        "api/auth/login/",
        TokenObtainPairView.as_view(),
        name="token-obtain-pair",
    ),

    path(
        "api/auth/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),

    path(
        "api/auth/",
        include("apps.users.urls"),
    ),

    path(
        "api/customers/",
        include("apps.customers.urls"),
    ),

    path(
        "api/transactions/",
        include("apps.transactions.urls"),
    ),
]

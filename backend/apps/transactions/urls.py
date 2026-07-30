from django.urls import path

from apps.transactions.views import (
    TransactionDetailView,
    TransactionExportView,
    TransactionListView,
    TransactionOptionsView,
)


app_name = "transactions"


urlpatterns = [
    path(
        "",
        TransactionListView.as_view(),
        name="transaction-list",
    ),
    path(
        "options/",
        TransactionOptionsView.as_view(),
        name="transaction-options",
    ),
    path(
        "export/",
        TransactionExportView.as_view(),
        name="transaction-export",
    ),
    path(
        "<int:pk>/",
        TransactionDetailView.as_view(),
        name="transaction-detail",
    ),
]

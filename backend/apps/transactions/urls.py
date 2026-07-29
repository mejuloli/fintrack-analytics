from django.urls import path

from apps.transactions.views import (
    TransactionDetailView,
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
        "<int:pk>/",
        TransactionDetailView.as_view(),
        name="transaction-detail",
    ),
]

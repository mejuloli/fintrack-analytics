from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardResultsSetPagination
from apps.transactions.filters import filter_transactions
from apps.transactions.models import (
    Transaction,
    TransactionCategory,
    TransactionChannel,
    TransactionStatus,
    TransactionType,
)
from apps.transactions.serializers import (
    TransactionSerializer,
)


def serialize_choices(choices):
    return [
        {
            "value": value,
            "label": label,
        }
        for value, label in choices
    ]


class TransactionListView(ListAPIView):
    serializer_class = TransactionSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Transaction.objects.select_related(
            "customer",
        )

        return filter_transactions(
            queryset=queryset,
            query_params=self.request.query_params,
        )


class TransactionDetailView(RetrieveAPIView):
    serializer_class = TransactionSerializer

    queryset = Transaction.objects.select_related(
        "customer",
    )


class TransactionOptionsView(APIView):
    def get(self, request):
        return Response(
            {
                "categories": serialize_choices(
                    TransactionCategory.choices,
                ),
                "transaction_types": serialize_choices(
                    TransactionType.choices,
                ),
                "channels": serialize_choices(
                    TransactionChannel.choices,
                ),
                "statuses": serialize_choices(
                    TransactionStatus.choices,
                ),
            }
        )

import csv

from django.http import HttpResponse
from django.utils import timezone
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


CSV_FORMULA_PREFIXES = (
    "=",
    "+",
    "-",
    "@",
)


def sanitize_csv_cell(value):
    text = (
        ""
        if value is None
        else str(value)
    )

    if text.startswith(
        CSV_FORMULA_PREFIXES,
    ):
        return f"'{text}"

    return text


def format_csv_amount(value):
    return format(
        value,
        ".2f",
    ).replace(
        ".",
        ",",
    )


def format_csv_datetime(value):
    return timezone.localtime(
        value,
    ).strftime(
        "%d/%m/%Y %H:%M",
    )


class TransactionExportView(APIView):
    def get(self, request):
        queryset = (
            Transaction.objects.select_related(
                "customer",
            )
        )

        transactions = filter_transactions(
            queryset=queryset,
            query_params=request.query_params,
        )

        response = HttpResponse(
            content_type=(
                "text/csv; charset=utf-8"
            ),
        )

        response["Content-Disposition"] = (
            'attachment; filename="transacoes.csv"'
        )

        # BOM para o Excel reconhecer UTF-8.
        response.write("\ufeff")

        writer = csv.writer(
            response,
            delimiter=";",
            lineterminator="\n",
        )

        writer.writerow(
            [
                "Identificador",
                "Data da transação",
                "Cliente",
                "Identificador do cliente",
                "Valor (R$)",
                "Categoria",
                "Tipo",
                "Canal",
                "Status",
                "Cidade",
                "Estado",
                "Descrição",
            ]
        )

        for transaction in transactions.iterator(
            chunk_size=2000,
        ):
            writer.writerow(
                [
                    sanitize_csv_cell(
                        transaction.external_id,
                    ),
                    format_csv_datetime(
                        transaction.transaction_date,
                    ),
                    sanitize_csv_cell(
                        transaction.customer.name,
                    ),
                    sanitize_csv_cell(
                        transaction.customer.external_id,
                    ),
                    format_csv_amount(
                        transaction.amount,
                    ),
                    sanitize_csv_cell(
                        transaction.get_category_display(),
                    ),
                    sanitize_csv_cell(
                        transaction
                        .get_transaction_type_display(),
                    ),
                    sanitize_csv_cell(
                        transaction.get_channel_display(),
                    ),
                    sanitize_csv_cell(
                        transaction.get_status_display(),
                    ),
                    sanitize_csv_cell(
                        transaction.city,
                    ),
                    sanitize_csv_cell(
                        transaction.state,
                    ),
                    sanitize_csv_cell(
                        transaction.description,
                    ),
                ]
            )

        return response


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

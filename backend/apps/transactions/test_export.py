import csv
import io
from datetime import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.customers.models import Customer
from apps.transactions.models import (
    Transaction,
    TransactionCategory,
    TransactionChannel,
    TransactionStatus,
    TransactionType,
)


def parse_csv_response(response):
    content = response.content.decode(
        "utf-8-sig",
    )

    return list(
        csv.reader(
            io.StringIO(content),
            delimiter=";",
        )
    )


class TransactionExportApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = (
            get_user_model().objects.create_user(
                email="export@example.com",
                password="strong-test-password",
                name="Analista de Exportação",
            )
        )

        cls.customer_sp = Customer.objects.create(
            external_id="CUST-EXPORT-0001",
            name="Ana Souza",
            email="ana-export@example.com",
            city="São Paulo",
            state="SP",
        )

        cls.customer_rj = Customer.objects.create(
            external_id="CUST-EXPORT-0002",
            name="Bruno Lima",
            email="bruno-export@example.com",
            city="Rio de Janeiro",
            state="RJ",
        )

        cls.transaction_1 = cls.create_transaction(
            external_id="TRX-EXPORT-0001",
            customer=cls.customer_sp,
            transaction_date=datetime(
                2026,
                7,
                1,
                10,
                0,
            ),
            amount="100.00",
            category=TransactionCategory.FOOD,
            status=TransactionStatus.APPROVED,
            description="Compra no mercado",
        )

        cls.transaction_2 = cls.create_transaction(
            external_id="TRX-EXPORT-0002",
            customer=cls.customer_sp,
            transaction_date=datetime(
                2026,
                7,
                2,
                11,
                30,
            ),
            amount="250.50",
            category=TransactionCategory.TRANSPORT,
            status=TransactionStatus.REJECTED,
            description="Transporte particular",
        )

        cls.transaction_3 = cls.create_transaction(
            external_id="TRX-EXPORT-0003",
            customer=cls.customer_rj,
            transaction_date=datetime(
                2026,
                7,
                3,
                12,
                45,
            ),
            amount="500.00",
            category=TransactionCategory.HEALTH,
            status=TransactionStatus.APPROVED,
            description="=2+2",
        )

    @classmethod
    def create_transaction(
        cls,
        *,
        external_id,
        customer,
        transaction_date,
        amount,
        category,
        status,
        description,
    ):
        return Transaction.objects.create(
            external_id=external_id,
            customer=customer,
            transaction_date=timezone.make_aware(
                transaction_date,
            ),
            amount=Decimal(amount),
            category=category,
            transaction_type=TransactionType.DEBIT,
            channel=TransactionChannel.PIX,
            status=status,
            city=customer.city,
            state=customer.state,
            description=description,
        )

    def setUp(self):
        self.client.force_authenticate(
            user=self.user,
        )

    def test_export_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse(
                "transactions:transaction-export",
            ),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_export_returns_utf8_csv(self):
        response = self.client.get(
            reverse(
                "transactions:transaction-export",
            ),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response["Content-Type"],
            "text/csv; charset=utf-8",
        )

        self.assertEqual(
            response["Content-Disposition"],
            'attachment; filename="transacoes.csv"',
        )

        self.assertTrue(
            response.content.startswith(
                b"\xef\xbb\xbf",
            )
        )

        rows = parse_csv_response(response)

        self.assertEqual(
            rows[0],
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
            ],
        )

        self.assertEqual(len(rows), 4)

    def test_export_applies_filters_without_pagination(self):
        response = self.client.get(
            reverse(
                "transactions:transaction-export",
            ),
            {
                "customer": (
                    self.customer_sp.external_id
                ),
                "page": 1,
                "page_size": 1,
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        rows = parse_csv_response(response)
        external_ids = {
            row[0]
            for row in rows[1:]
        }

        self.assertEqual(
            external_ids,
            {
                self.transaction_1.external_id,
                self.transaction_2.external_id,
            },
        )

    def test_export_formats_amount_and_protects_formulas(
        self,
    ):
        response = self.client.get(
            reverse(
                "transactions:transaction-export",
            ),
            {
                "customer": (
                    self.customer_rj.external_id
                ),
            },
        )

        rows = parse_csv_response(response)

        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[1][4], "500,00")
        self.assertEqual(rows[1][11], "'=2+2")

    def test_export_rejects_invalid_filters(self):
        response = self.client.get(
            reverse(
                "transactions:transaction-export",
            ),
            {
                "start_date": "01-07-2026",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "start_date",
            response.data,
        )

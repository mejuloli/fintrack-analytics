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


def create_transaction(
    *,
    external_id,
    customer,
    transaction_date,
    amount,
    category,
    status,
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
        description=f"Transação {external_id}",
    )


class TransactionApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(
            email="analyst@example.com",
            password="strong-test-password",
            name="Analista de Teste",
        )

        cls.customer_sp = Customer.objects.create(
            external_id="CUST-TEST-0001",
            name="Ana Souza",
            email="ana@example.com",
            city="São Paulo",
            state="SP",
        )

        cls.customer_rj = Customer.objects.create(
            external_id="CUST-TEST-0002",
            name="Bruno Lima",
            email="bruno@example.com",
            city="Rio de Janeiro",
            state="RJ",
        )

        cls.transaction_1 = create_transaction(
            external_id="TRX-TEST-0001",
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
        )

        cls.transaction_2 = create_transaction(
            external_id="TRX-TEST-0002",
            customer=cls.customer_sp,
            transaction_date=datetime(
                2026,
                7,
                15,
                12,
                0,
            ),
            amount="500.00",
            category=TransactionCategory.TRANSPORT,
            status=TransactionStatus.REJECTED,
        )

        cls.transaction_3 = create_transaction(
            external_id="TRX-TEST-0003",
            customer=cls.customer_rj,
            transaction_date=datetime(
                2026,
                7,
                20,
                14,
                0,
            ),
            amount="1500.00",
            category=TransactionCategory.HEALTH,
            status=TransactionStatus.APPROVED,
        )

        cls.transaction_4 = create_transaction(
            external_id="TRX-TEST-0004",
            customer=cls.customer_rj,
            transaction_date=datetime(
                2026,
                7,
                25,
                16,
                0,
            ),
            amount="2500.00",
            category=TransactionCategory.SERVICES,
            status=TransactionStatus.PENDING,
        )

    def setUp(self):
        self.client.force_authenticate(
            user=self.user,
        )

    def test_transaction_list_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse("transactions:transaction-list"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_transaction_list_is_paginated(self):
        response = self.client.get(
            reverse("transactions:transaction-list"),
            {
                "page_size": 2,
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(response.data["count"], 4)
        self.assertEqual(response.data["total_pages"], 2)
        self.assertEqual(response.data["page_size"], 2)
        self.assertEqual(len(response.data["results"]), 2)

    def test_transaction_list_filters_by_status(self):
        response = self.client.get(
            reverse("transactions:transaction-list"),
            {
                "status": TransactionStatus.APPROVED,
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(response.data["count"], 2)

        returned_statuses = {
            item["status"]
            for item in response.data["results"]
        }

        self.assertEqual(
            returned_statuses,
            {TransactionStatus.APPROVED},
        )

    def test_transaction_list_filters_by_customer(self):
        response = self.client.get(
            reverse("transactions:transaction-list"),
            {
                "customer": self.customer_sp.external_id,
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(response.data["count"], 2)

        returned_customers = {
            item["customer"]["external_id"]
            for item in response.data["results"]
        }

        self.assertEqual(
            returned_customers,
            {self.customer_sp.external_id},
        )

    def test_transaction_list_filters_by_amount_range(self):
        response = self.client.get(
            reverse("transactions:transaction-list"),
            {
                "min_amount": "400",
                "max_amount": "1600",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(response.data["count"], 2)

        returned_ids = {
            item["external_id"]
            for item in response.data["results"]
        }

        self.assertEqual(
            returned_ids,
            {
                self.transaction_2.external_id,
                self.transaction_3.external_id,
            },
        )

    def test_transaction_list_filters_by_date_range(self):
        response = self.client.get(
            reverse("transactions:transaction-list"),
            {
                "start_date": "2026-07-10",
                "end_date": "2026-07-21",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(response.data["count"], 2)

        returned_ids = {
            item["external_id"]
            for item in response.data["results"]
        }

        self.assertEqual(
            returned_ids,
            {
                self.transaction_2.external_id,
                self.transaction_3.external_id,
            },
        )

    def test_transaction_list_orders_by_amount(self):
        response = self.client.get(
            reverse("transactions:transaction-list"),
            {
                "ordering": "-amount",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["results"][0]["external_id"],
            self.transaction_4.external_id,
        )

    def test_transaction_list_rejects_invalid_date(self):
        response = self.client.get(
            reverse("transactions:transaction-list"),
            {
                "start_date": "20-07-2026",
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

    def test_transaction_list_rejects_invalid_amount(self):
        response = self.client.get(
            reverse("transactions:transaction-list"),
            {
                "min_amount": "invalid",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "min_amount",
            response.data,
        )

    def test_transaction_list_rejects_invalid_range(self):
        response = self.client.get(
            reverse("transactions:transaction-list"),
            {
                "min_amount": "2000",
                "max_amount": "1000",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "max_amount",
            response.data,
        )

    def test_transaction_list_rejects_invalid_ordering(self):
        response = self.client.get(
            reverse("transactions:transaction-list"),
            {
                "ordering": "customer",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "ordering",
            response.data,
        )

    def test_transaction_options_returns_choices(self):
        response = self.client.get(
            reverse("transactions:transaction-options"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn("categories", response.data)
        self.assertIn("transaction_types", response.data)
        self.assertIn("channels", response.data)
        self.assertIn("statuses", response.data)

        self.assertIn(
            {
                "value": TransactionStatus.APPROVED,
                "label": "Aprovada",
            },
            response.data["statuses"],
        )

    def test_transaction_detail_returns_labels(self):
        response = self.client.get(
            reverse(
                "transactions:transaction-detail",
                kwargs={
                    "pk": self.transaction_1.pk,
                },
            ),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["external_id"],
            self.transaction_1.external_id,
        )

        self.assertEqual(
            response.data["amount"],
            "100.00",
        )

        self.assertEqual(
            response.data["category_label"],
            "Alimentação",
        )

        self.assertEqual(
            response.data["status_label"],
            "Aprovada",
        )

        self.assertEqual(
            response.data["customer"]["external_id"],
            self.customer_sp.external_id,
        )

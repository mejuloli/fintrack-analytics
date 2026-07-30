from datetime import timedelta
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


class DashboardAnalyticsApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = (
            get_user_model().objects.create_user(
                email="dashboard@example.com",
                password="strong-test-password",
                name="Analista Dashboard",
            )
        )

        cls.customer_1 = Customer.objects.create(
            external_id="CUST-DASH-0001",
            name="Cliente Ativo",
            email="active@example.com",
            city="São Paulo",
            state="SP",
            is_active=True,
        )

        cls.customer_2 = Customer.objects.create(
            external_id="CUST-DASH-0002",
            name="Cliente Inativo",
            email="inactive@example.com",
            city="Rio de Janeiro",
            state="RJ",
            is_active=False,
        )

        now = timezone.now()

        cls.create_transaction(
            external_id="TRX-DASH-0001",
            customer=cls.customer_1,
            transaction_date=(
                now - timedelta(days=1)
            ),
            amount="100.00",
            category=TransactionCategory.FOOD,
            status=TransactionStatus.APPROVED,
        )

        cls.create_transaction(
            external_id="TRX-DASH-0002",
            customer=cls.customer_1,
            transaction_date=(
                now - timedelta(days=2)
            ),
            amount="200.00",
            category=TransactionCategory.FOOD,
            status=TransactionStatus.REJECTED,
        )

        cls.create_transaction(
            external_id="TRX-DASH-0003",
            customer=cls.customer_2,
            transaction_date=(
                now - timedelta(days=3)
            ),
            amount="300.00",
            category=TransactionCategory.HEALTH,
            status=TransactionStatus.APPROVED,
        )

        cls.create_transaction(
            external_id="TRX-DASH-0004",
            customer=cls.customer_2,
            transaction_date=(
                now - timedelta(days=40)
            ),
            amount="400.00",
            category=TransactionCategory.SERVICES,
            status=TransactionStatus.PENDING,
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
    ):
        return Transaction.objects.create(
            external_id=external_id,
            customer=customer,
            transaction_date=transaction_date,
            amount=Decimal(amount),
            category=category,
            transaction_type=TransactionType.DEBIT,
            channel=TransactionChannel.PIX,
            status=status,
            city=customer.city,
            state=customer.state,
            description=external_id,
        )

    def setUp(self):
        self.client.force_authenticate(
            user=self.user,
        )

    def test_dashboard_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse("dashboard:analytics"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_dashboard_returns_summary(self):
        response = self.client.get(
            reverse("dashboard:analytics"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        summary = response.data["summary"]

        self.assertEqual(
            summary["total_customers"],
            2,
        )
        self.assertEqual(
            summary["active_customers"],
            1,
        )
        self.assertEqual(
            summary["customers_with_transactions"],
            2,
        )
        self.assertEqual(
            summary["total_transactions"],
            3,
        )
        self.assertEqual(
            summary["total_amount"],
            "600.00",
        )
        self.assertEqual(
            summary["approved_transactions"],
            2,
        )
        self.assertEqual(
            summary["approved_amount"],
            "400.00",
        )
        self.assertEqual(
            summary["average_ticket"],
            "200.00",
        )
        self.assertEqual(
            summary["approval_rate"],
            66.67,
        )

    def test_dashboard_returns_distributions(self):
        response = self.client.get(
            reverse("dashboard:analytics"),
        )

        statuses = {
            item["value"]: item
            for item in response.data["by_status"]
        }

        self.assertEqual(
            statuses[
                TransactionStatus.APPROVED
            ]["count"],
            2,
        )
        self.assertEqual(
            statuses[
                TransactionStatus.APPROVED
            ]["amount"],
            "400.00",
        )
        self.assertEqual(
            statuses[
                TransactionStatus.PENDING
            ]["count"],
            0,
        )

        categories = {
            item["value"]: item
            for item in response.data[
                "by_category"
            ]
        }

        self.assertEqual(
            categories[
                TransactionCategory.FOOD
            ]["count"],
            2,
        )
        self.assertEqual(
            categories[
                TransactionCategory.HEALTH
            ]["amount"],
            "300.00",
        )

    def test_dashboard_returns_daily_period(self):
        response = self.client.get(
            reverse("dashboard:analytics"),
        )

        self.assertEqual(
            response.data["period"]["days"],
            30,
        )
        self.assertEqual(
            len(response.data["daily"]),
            30,
        )

        total_daily_transactions = sum(
            item["count"]
            for item in response.data["daily"]
        )

        self.assertEqual(
            total_daily_transactions,
            3,
        )

    def test_dashboard_accepts_custom_period(self):
        response = self.client.get(
            reverse("dashboard:analytics"),
            {
                "days": 60,
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["period"]["days"],
            60,
        )
        self.assertEqual(
            response.data["summary"][
                "total_transactions"
            ],
            4,
        )
        self.assertEqual(
            response.data["summary"][
                "total_amount"
            ],
            "1000.00",
        )

    def test_dashboard_rejects_invalid_period(self):
        url = reverse("dashboard:analytics")

        for value in ("invalid", "6", "366"):
            with self.subTest(value=value):
                response = self.client.get(
                    url,
                    {
                        "days": value,
                    },
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_400_BAD_REQUEST,
                )
                self.assertIn(
                    "days",
                    response.data,
                )

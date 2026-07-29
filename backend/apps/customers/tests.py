from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.customers.models import Customer


class CustomerApiTests(APITestCase):
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
            is_active=True,
        )

        cls.customer_rj = Customer.objects.create(
            external_id="CUST-TEST-0002",
            name="Bruno Lima",
            email="bruno@example.com",
            city="Rio de Janeiro",
            state="RJ",
            is_active=False,
        )

    def setUp(self):
        self.client.force_authenticate(
            user=self.user,
        )

    def test_customer_list_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse("customers:customer-list"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_customer_list_is_paginated(self):
        response = self.client.get(
            reverse("customers:customer-list"),
            {
                "page_size": 1,
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(response.data["count"], 2)
        self.assertEqual(response.data["total_pages"], 2)
        self.assertEqual(response.data["page"], 1)
        self.assertEqual(response.data["page_size"], 1)
        self.assertEqual(len(response.data["results"]), 1)

    def test_customer_list_filters_by_state(self):
        response = self.client.get(
            reverse("customers:customer-list"),
            {
                "state": "sp",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(response.data["count"], 1)

        self.assertEqual(
            response.data["results"][0]["external_id"],
            self.customer_sp.external_id,
        )

    def test_customer_list_searches_by_name(self):
        response = self.client.get(
            reverse("customers:customer-list"),
            {
                "search": "Bruno",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(response.data["count"], 1)

        self.assertEqual(
            response.data["results"][0]["name"],
            "Bruno Lima",
        )

    def test_customer_list_filters_by_active_status(self):
        response = self.client.get(
            reverse("customers:customer-list"),
            {
                "is_active": "false",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(response.data["count"], 1)

        self.assertEqual(
            response.data["results"][0]["external_id"],
            self.customer_rj.external_id,
        )

    def test_customer_list_rejects_invalid_active_status(self):
        response = self.client.get(
            reverse("customers:customer-list"),
            {
                "is_active": "invalid",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "is_active",
            response.data,
        )

    def test_customer_detail_returns_customer(self):
        response = self.client.get(
            reverse(
                "customers:customer-detail",
                kwargs={
                    "pk": self.customer_sp.pk,
                },
            ),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["external_id"],
            self.customer_sp.external_id,
        )

        self.assertEqual(
            response.data["transaction_count"],
            0,
        )

        self.assertNotIn(
            "document",
            response.data,
        )

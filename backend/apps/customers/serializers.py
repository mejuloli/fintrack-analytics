from rest_framework import serializers

from apps.customers.models import Customer


class CustomerListSerializer(serializers.ModelSerializer):
    transaction_count = serializers.IntegerField(
        read_only=True,
    )

    class Meta:
        model = Customer

        fields = (
            "id",
            "external_id",
            "name",
            "email",
            "city",
            "state",
            "is_active",
            "transaction_count",
        )

        read_only_fields = fields


class CustomerDetailSerializer(serializers.ModelSerializer):
    transaction_count = serializers.IntegerField(
        read_only=True,
    )

    class Meta:
        model = Customer

        fields = (
            "id",
            "external_id",
            "name",
            "email",
            "city",
            "state",
            "is_active",
            "transaction_count",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields

from rest_framework import serializers

from apps.customers.models import Customer
from apps.transactions.models import Transaction


class TransactionCustomerSerializer(
    serializers.ModelSerializer,
):
    class Meta:
        model = Customer

        fields = (
            "id",
            "external_id",
            "name",
        )

        read_only_fields = fields


class TransactionSerializer(serializers.ModelSerializer):
    customer = TransactionCustomerSerializer(
        read_only=True,
    )

    category_label = serializers.CharField(
        source="get_category_display",
        read_only=True,
    )

    transaction_type_label = serializers.CharField(
        source="get_transaction_type_display",
        read_only=True,
    )

    channel_label = serializers.CharField(
        source="get_channel_display",
        read_only=True,
    )

    status_label = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = Transaction

        fields = (
            "id",
            "external_id",
            "customer",
            "transaction_date",
            "amount",
            "category",
            "category_label",
            "transaction_type",
            "transaction_type_label",
            "channel",
            "channel_label",
            "status",
            "status_label",
            "city",
            "state",
            "description",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields

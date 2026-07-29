from django.contrib import admin

from apps.transactions.models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "external_id",
        "customer",
        "amount",
        "category",
        "transaction_type",
        "channel",
        "status",
        "transaction_date",
    )

    list_filter = (
        "status",
        "category",
        "transaction_type",
        "channel",
        "state",
    )

    search_fields = (
        "external_id",
        "customer__external_id",
        "customer__name",
        "description",
    )

    autocomplete_fields = (
        "customer",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    list_select_related = (
        "customer",
    )

    ordering = (
        "-transaction_date",
        "-id",
    )

    date_hierarchy = "transaction_date"

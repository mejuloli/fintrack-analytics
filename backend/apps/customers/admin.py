from django.contrib import admin

from apps.customers.models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        "external_id",
        "name",
        "email",
        "city",
        "state",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_active",
        "state",
        "created_at",
    )

    search_fields = (
        "external_id",
        "name",
        "email",
        "document",
    )

    ordering = (
        "name",
        "external_id",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

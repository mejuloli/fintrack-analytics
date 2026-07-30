from datetime import timedelta
from decimal import Decimal

from django.db.models import (
    Avg,
    Count,
    DecimalField,
    Q,
    Sum,
    Value,
)
from django.db.models.functions import (
    Coalesce,
    TruncDate,
)
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.models import Customer
from apps.transactions.models import (
    Transaction,
    TransactionCategory,
    TransactionStatus,
)


MONEY_FIELD = DecimalField(
    max_digits=18,
    decimal_places=2,
)


def parse_days(value):
    if value in (None, ""):
        return 30

    try:
        days = int(value)
    except (TypeError, ValueError) as error:
        raise ValidationError(
            {
                "days": (
                    "Informe um número inteiro entre "
                    "7 e 365."
                ),
            }
        ) from error

    if not 7 <= days <= 365:
        raise ValidationError(
            {
                "days": (
                    "Informe um número inteiro entre "
                    "7 e 365."
                ),
            }
        )

    return days


def format_money(value):
    amount = value or Decimal("0.00")
    return format(amount, ".2f")


def serialize_distribution(
    *,
    choices,
    aggregated_items,
):
    items_by_value = {
        item["value"]: item
        for item in aggregated_items
    }

    return [
        {
            "value": value,
            "label": label,
            "count": items_by_value.get(
                value,
                {},
            ).get(
                "count",
                0,
            ),
            "amount": format_money(
                items_by_value.get(
                    value,
                    {},
                ).get(
                    "amount",
                )
            ),
        }
        for value, label in choices
    ]


class DashboardAnalyticsView(APIView):
    def get(self, request):
        days = parse_days(
            request.query_params.get("days"),
        )

        end_date = timezone.localdate()
        start_date = end_date - timedelta(
            days=days - 1,
        )

        transactions = Transaction.objects.filter(
            transaction_date__date__range=(
                start_date,
                end_date,
            ),
        )

        summary = transactions.aggregate(
            total_transactions=Count("id"),
            total_amount=Coalesce(
                Sum("amount"),
                Value(Decimal("0.00")),
                output_field=MONEY_FIELD,
            ),
            approved_transactions=Count(
                "id",
                filter=Q(
                    status=TransactionStatus.APPROVED,
                ),
            ),
            approved_amount=Coalesce(
                Sum(
                    "amount",
                    filter=Q(
                        status=(
                            TransactionStatus.APPROVED
                        ),
                    ),
                ),
                Value(Decimal("0.00")),
                output_field=MONEY_FIELD,
            ),
            average_ticket=Coalesce(
                Avg("amount"),
                Value(Decimal("0.00")),
                output_field=MONEY_FIELD,
            ),
        )

        total_transactions = (
            summary["total_transactions"]
        )
        approved_transactions = (
            summary["approved_transactions"]
        )

        approval_rate = (
            round(
                approved_transactions
                / total_transactions
                * 100,
                2,
            )
            if total_transactions
            else 0
        )

        status_items = (
            transactions
            .values("status")
            .annotate(
                count=Count("id"),
                amount=Coalesce(
                    Sum("amount"),
                    Value(Decimal("0.00")),
                    output_field=MONEY_FIELD,
                ),
            )
            .order_by()
        )

        category_items = (
            transactions
            .values("category")
            .annotate(
                count=Count("id"),
                amount=Coalesce(
                    Sum("amount"),
                    Value(Decimal("0.00")),
                    output_field=MONEY_FIELD,
                ),
            )
            .order_by("-amount", "category")
        )

        status_distribution = (
            serialize_distribution(
                choices=TransactionStatus.choices,
                aggregated_items=[
                    {
                        "value": item["status"],
                        "count": item["count"],
                        "amount": item["amount"],
                    }
                    for item in status_items
                ],
            )
        )

        category_distribution = (
            serialize_distribution(
                choices=TransactionCategory.choices,
                aggregated_items=[
                    {
                        "value": item["category"],
                        "count": item["count"],
                        "amount": item["amount"],
                    }
                    for item in category_items
                ],
            )
        )

        daily_items = (
            transactions
            .annotate(
                date=TruncDate("transaction_date"),
            )
            .values("date")
            .annotate(
                count=Count("id"),
                amount=Coalesce(
                    Sum("amount"),
                    Value(Decimal("0.00")),
                    output_field=MONEY_FIELD,
                ),
            )
            .order_by("date")
        )

        daily_by_date = {
            item["date"]: item
            for item in daily_items
        }

        daily = []

        for offset in range(days):
            current_date = (
                start_date
                + timedelta(days=offset)
            )

            item = daily_by_date.get(
                current_date,
            )

            daily.append(
                {
                    "date": current_date.isoformat(),
                    "count": (
                        item["count"]
                        if item
                        else 0
                    ),
                    "amount": format_money(
                        item["amount"]
                        if item
                        else None
                    ),
                }
            )

        return Response(
            {
                "period": {
                    "days": days,
                    "start_date": (
                        start_date.isoformat()
                    ),
                    "end_date": end_date.isoformat(),
                },
                "summary": {
                    "total_customers": (
                        Customer.objects.count()
                    ),
                    "active_customers": (
                        Customer.objects.filter(
                            is_active=True,
                        ).count()
                    ),
                    "customers_with_transactions": (
                        transactions.values(
                            "customer_id",
                        ).distinct().count()
                    ),
                    "total_transactions": (
                        total_transactions
                    ),
                    "total_amount": format_money(
                        summary["total_amount"],
                    ),
                    "approved_transactions": (
                        approved_transactions
                    ),
                    "approved_amount": format_money(
                        summary["approved_amount"],
                    ),
                    "average_ticket": format_money(
                        summary["average_ticket"],
                    ),
                    "approval_rate": approval_rate,
                },
                "by_status": status_distribution,
                "by_category": category_distribution,
                "daily": daily,
            }
        )

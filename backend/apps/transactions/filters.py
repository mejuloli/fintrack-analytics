from decimal import Decimal, InvalidOperation

from django.db.models import Q, QuerySet
from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError


TRANSACTION_ORDERING_FIELDS = {
    "transaction_date",
    "-transaction_date",
    "amount",
    "-amount",
    "external_id",
    "-external_id",
    "created_at",
    "-created_at",
}


def _parse_date_parameter(
    query_params,
    parameter_name,
):
    value = query_params.get(parameter_name)

    if not value:
        return None

    parsed_value = parse_date(value)

    if parsed_value is None:
        raise ValidationError(
            {
                parameter_name: (
                    "Use uma data no formato AAAA-MM-DD."
                )
            }
        )

    return parsed_value


def _parse_decimal_parameter(
    query_params,
    parameter_name,
):
    value = query_params.get(parameter_name)

    if value in {None, ""}:
        return None

    try:
        parsed_value = Decimal(value)
    except InvalidOperation as error:
        raise ValidationError(
            {
                parameter_name: (
                    "Informe um valor decimal válido."
                )
            }
        ) from error

    if parsed_value < 0:
        raise ValidationError(
            {
                parameter_name: (
                    "O valor não pode ser negativo."
                )
            }
        )

    return parsed_value


def filter_transactions(
    queryset: QuerySet,
    query_params,
) -> QuerySet:
    search = query_params.get(
        "search",
        "",
    ).strip()

    if search:
        queryset = queryset.filter(
            Q(external_id__icontains=search)
            | Q(customer__external_id__icontains=search)
            | Q(customer__name__icontains=search)
            | Q(description__icontains=search)
        )

    exact_filters = {
        "status": "status",
        "category": "category",
        "channel": "channel",
        "transaction_type": "transaction_type",
        "state": "state",
        "customer": "customer__external_id",
    }

    for parameter_name, model_field in exact_filters.items():
        value = query_params.get(
            parameter_name,
            "",
        ).strip()

        if value:
            if parameter_name == "state":
                value = value.upper()

            queryset = queryset.filter(
                **{model_field: value},
            )

    start_date = _parse_date_parameter(
        query_params,
        "start_date",
    )

    end_date = _parse_date_parameter(
        query_params,
        "end_date",
    )

    if start_date and end_date and start_date > end_date:
        raise ValidationError(
            {
                "end_date": (
                    "A data final deve ser igual ou posterior "
                    "à data inicial."
                )
            }
        )

    if start_date:
        queryset = queryset.filter(
            transaction_date__date__gte=start_date,
        )

    if end_date:
        queryset = queryset.filter(
            transaction_date__date__lte=end_date,
        )

    min_amount = _parse_decimal_parameter(
        query_params,
        "min_amount",
    )

    max_amount = _parse_decimal_parameter(
        query_params,
        "max_amount",
    )

    if (
        min_amount is not None
        and max_amount is not None
        and min_amount > max_amount
    ):
        raise ValidationError(
            {
                "max_amount": (
                    "O valor máximo deve ser igual ou maior "
                    "que o valor mínimo."
                )
            }
        )

    if min_amount is not None:
        queryset = queryset.filter(
            amount__gte=min_amount,
        )

    if max_amount is not None:
        queryset = queryset.filter(
            amount__lte=max_amount,
        )

    ordering = query_params.get(
        "ordering",
        "-transaction_date",
    )

    if ordering not in TRANSACTION_ORDERING_FIELDS:
        raise ValidationError(
            {
                "ordering": (
                    "Campo de ordenação inválido."
                )
            }
        )

    return queryset.order_by(
        ordering,
        "-id",
    )

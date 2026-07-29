from django.db.models import Count, Q
from rest_framework.exceptions import ValidationError
from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
)

from apps.core.pagination import StandardResultsSetPagination
from apps.customers.models import Customer
from apps.customers.serializers import (
    CustomerDetailSerializer,
    CustomerListSerializer,
)


CUSTOMER_ORDERING_FIELDS = {
    "name",
    "-name",
    "external_id",
    "-external_id",
    "created_at",
    "-created_at",
}


class CustomerListView(ListAPIView):
    serializer_class = CustomerListSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Customer.objects.annotate(
            transaction_count=Count("transactions"),
        )

        search = self.request.query_params.get(
            "search",
            "",
        ).strip()

        if search:
            queryset = queryset.filter(
                Q(external_id__icontains=search)
                | Q(name__icontains=search)
                | Q(email__icontains=search)
            )

        state = self.request.query_params.get(
            "state",
            "",
        ).strip()

        if state:
            queryset = queryset.filter(
                state=state.upper(),
            )

        is_active = self.request.query_params.get(
            "is_active",
        )

        if is_active is not None:
            normalized_value = is_active.lower()

            if normalized_value in {"true", "1"}:
                queryset = queryset.filter(
                    is_active=True,
                )
            elif normalized_value in {"false", "0"}:
                queryset = queryset.filter(
                    is_active=False,
                )
            else:
                raise ValidationError(
                    {
                        "is_active": (
                            "Use true, false, 1 ou 0."
                        )
                    }
                )

        ordering = self.request.query_params.get(
            "ordering",
            "name",
        )

        if ordering not in CUSTOMER_ORDERING_FIELDS:
            raise ValidationError(
                {
                    "ordering": (
                        "Campo de ordenação inválido."
                    )
                }
            )

        return queryset.order_by(
            ordering,
            "id",
        )


class CustomerDetailView(RetrieveAPIView):
    serializer_class = CustomerDetailSerializer

    queryset = Customer.objects.annotate(
        transaction_count=Count("transactions"),
    )

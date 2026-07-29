from django.db import models

from apps.customers.models import Customer


class TransactionType(models.TextChoices):
    CREDIT = "CREDIT", "Crédito"
    DEBIT = "DEBIT", "Débito"
    TRANSFER = "TRANSFER", "Transferência"
    PAYMENT = "PAYMENT", "Pagamento"


class TransactionChannel(models.TextChoices):
    CARD = "CARD", "Cartão"
    PIX = "PIX", "Pix"
    BANK_TRANSFER = "BANK_TRANSFER", "Transferência bancária"
    APP = "APP", "Aplicativo"
    ATM = "ATM", "Caixa eletrônico"


class TransactionStatus(models.TextChoices):
    APPROVED = "APPROVED", "Aprovada"
    REJECTED = "REJECTED", "Rejeitada"
    PENDING = "PENDING", "Pendente"
    REVERSED = "REVERSED", "Estornada"


class TransactionCategory(models.TextChoices):
    FOOD = "FOOD", "Alimentação"
    TRANSPORT = "TRANSPORT", "Transporte"
    HEALTH = "HEALTH", "Saúde"
    EDUCATION = "EDUCATION", "Educação"
    LEISURE = "LEISURE", "Lazer"
    HOUSING = "HOUSING", "Moradia"
    SERVICES = "SERVICES", "Serviços"
    TRANSFER = "TRANSFER", "Transferência"
    OTHER = "OTHER", "Outros"


class Transaction(models.Model):
    external_id = models.CharField(
        "identificador externo",
        max_length=50,
        unique=True,
        db_index=True,
    )

    customer = models.ForeignKey(
        Customer,
        verbose_name="cliente",
        related_name="transactions",
        on_delete=models.PROTECT,
    )

    transaction_date = models.DateTimeField(
        "data da transação",
        db_index=True,
    )

    amount = models.DecimalField(
        "valor",
        max_digits=14,
        decimal_places=2,
    )

    category = models.CharField(
        "categoria",
        max_length=20,
        choices=TransactionCategory.choices,
        db_index=True,
    )

    transaction_type = models.CharField(
        "tipo",
        max_length=20,
        choices=TransactionType.choices,
    )

    channel = models.CharField(
        "canal",
        max_length=20,
        choices=TransactionChannel.choices,
        db_index=True,
    )

    status = models.CharField(
        "status",
        max_length=20,
        choices=TransactionStatus.choices,
        db_index=True,
    )

    city = models.CharField(
        "cidade",
        max_length=100,
        blank=True,
    )

    state = models.CharField(
        "estado",
        max_length=2,
        blank=True,
        db_index=True,
    )

    description = models.CharField(
        "descrição",
        max_length=255,
        blank=True,
    )

    created_at = models.DateTimeField(
        "criado em",
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        "atualizado em",
        auto_now=True,
    )

    class Meta:
        verbose_name = "transação"
        verbose_name_plural = "transações"
        ordering = ["-transaction_date", "-id"]

        indexes = [
            models.Index(
                fields=["customer", "transaction_date"],
                name="transaction_customer_date_idx",
            ),
            models.Index(
                fields=["status", "transaction_date"],
                name="transaction_status_date_idx",
            ),
        ]

        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name="transaction_amount_gt_zero",
            ),
        ]

    def __str__(self):
        return (
            f"{self.external_id} — "
            f"{self.customer.name} — "
            f"R$ {self.amount}"
        )

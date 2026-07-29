from django.db import models


class Customer(models.Model):
    external_id = models.CharField(
        "identificador externo",
        max_length=50,
        unique=True,
        db_index=True,
    )

    name = models.CharField(
        "nome",
        max_length=150,
    )

    email = models.EmailField(
        "e-mail",
        blank=True,
    )

    document = models.CharField(
        "documento",
        max_length=20,
        blank=True,
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
    )

    is_active = models.BooleanField(
        "ativo",
        default=True,
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
        verbose_name = "cliente"
        verbose_name_plural = "clientes"
        ordering = ["name", "external_id"]

    def __str__(self):
        return f"{self.name} ({self.external_id})"

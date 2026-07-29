import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.customers.models import Customer
from apps.transactions.models import (
    Transaction,
    TransactionCategory,
    TransactionChannel,
    TransactionStatus,
    TransactionType,
)


CUSTOMERS = [
    ("Ana Souza", "ana.souza", "São Paulo", "SP"),
    ("Bruno Lima", "bruno.lima", "Rio de Janeiro", "RJ"),
    ("Carla Mendes", "carla.mendes", "Belo Horizonte", "MG"),
    ("Daniel Rocha", "daniel.rocha", "Curitiba", "PR"),
    ("Eduarda Alves", "eduarda.alves", "Salvador", "BA"),
    ("Felipe Martins", "felipe.martins", "Fortaleza", "CE"),
    ("Gabriela Ribeiro", "gabriela.ribeiro", "Recife", "PE"),
    ("Henrique Costa", "henrique.costa", "Porto Alegre", "RS"),
    ("Isabela Gomes", "isabela.gomes", "Goiânia", "GO"),
    ("João Carvalho", "joao.carvalho", "Campinas", "SP"),
    ("Karen Oliveira", "karen.oliveira", "Florianópolis", "SC"),
    ("Lucas Ferreira", "lucas.ferreira", "Vitória", "ES"),
    ("Mariana Santos", "mariana.santos", "Manaus", "AM"),
    ("Nicolas Barbosa", "nicolas.barbosa", "Belém", "PA"),
    ("Olívia Freitas", "olivia.freitas", "Brasília", "DF"),
    ("Pedro Nunes", "pedro.nunes", "Natal", "RN"),
    ("Queila Moraes", "queila.moraes", "Maceió", "AL"),
    ("Rafael Cardoso", "rafael.cardoso", "João Pessoa", "PB"),
    ("Sofia Teixeira", "sofia.teixeira", "Aracaju", "SE"),
    ("Thiago Moreira", "thiago.moreira", "Cuiabá", "MT"),
]


class Command(BaseCommand):
    help = "Cria clientes e transações sintéticas para desenvolvimento."

    def handle(self, *args, **options):
        random_generator = random.Random(42)

        customers = self._create_customers()
        transactions_count = self._create_transactions(
            random_generator=random_generator,
            customers=customers,
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Dados sintéticos processados com sucesso: "
                f"{len(customers)} clientes e "
                f"{transactions_count} transações."
            )
        )

    def _create_customers(self):
        customers = []

        for index, customer_data in enumerate(
            CUSTOMERS,
            start=1,
        ):
            name, email_prefix, city, state = customer_data

            customer, _ = Customer.objects.update_or_create(
                external_id=f"CUST-{index:04d}",
                defaults={
                    "name": name,
                    "email": f"{email_prefix}@example.com",
                    "document": f"{index:011d}",
                    "city": city,
                    "state": state,
                    "is_active": True,
                },
            )

            customers.append(customer)

        return customers

    def _create_transactions(
        self,
        random_generator,
        customers,
    ):
        categories = list(TransactionCategory)
        transaction_types = list(TransactionType)
        channels = list(TransactionChannel)

        statuses = [
            TransactionStatus.APPROVED,
            TransactionStatus.REJECTED,
            TransactionStatus.PENDING,
            TransactionStatus.REVERSED,
        ]

        status_weights = [
            75,
            10,
            10,
            5,
        ]

        now = timezone.now()

        for index in range(1, 301):
            customer = random_generator.choice(customers)
            category = random_generator.choice(categories)
            transaction_type = random_generator.choice(
                transaction_types,
            )
            channel = random_generator.choice(channels)
            status = random_generator.choices(
                statuses,
                weights=status_weights,
                k=1,
            )[0]

            amount_in_cents = random_generator.randint(
                1_500,
                500_000,
            )

            amount = (
                Decimal(amount_in_cents)
                / Decimal("100")
            )

            days_ago = random_generator.randint(0, 89)
            minutes_ago = random_generator.randint(
                0,
                24 * 60,
            )

            transaction_date = (
                now
                - timedelta(days=days_ago)
                - timedelta(minutes=minutes_ago)
            )

            Transaction.objects.update_or_create(
                external_id=f"TRX-{index:06d}",
                defaults={
                    "customer": customer,
                    "transaction_date": transaction_date,
                    "amount": amount,
                    "category": category,
                    "transaction_type": transaction_type,
                    "channel": channel,
                    "status": status,
                    "city": customer.city,
                    "state": customer.state,
                    "description": (
                        f"{category.label} via "
                        f"{channel.label}"
                    ),
                },
            )

        return 300

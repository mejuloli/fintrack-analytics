from rest_framework import serializers

from apps.users.models import User


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = (
            "id",
            "name",
            "email",
            "role",
            "is_active",
            "is_staff",
            "created_at",
        )

        read_only_fields = fields

from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            database_result = cursor.fetchone()[0]

        return Response(
            {
                "status": "ok",
                "service": "fintrack-backend",
                "database": database_result == 1,
            }
        )

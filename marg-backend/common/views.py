from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import time

class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        db_ok = True
        try:
            # Test database connection
            connection.ensure_connection()
        except Exception:
            db_ok = False

        return Response({
            "success": db_ok,
            "status": "healthy" if db_ok else "unhealthy",
            "timestamp": time.time(),
            "services": {
                "database": "connected" if db_ok else "disconnected"
            }
        })

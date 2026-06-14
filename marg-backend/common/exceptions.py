from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    # Call DRF's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Format the DRF error response
        message = "An error occurred."
        errors = response.data

        # If a direct 'detail' message is present, elevate it to top-level message
        if isinstance(errors, dict):
            if 'detail' in errors:
                message = errors['detail']
                del errors['detail']
            elif len(errors) == 1:
                # Elevate single validation error key/val
                key = list(errors.keys())[0]
                val = errors[key]
                if isinstance(val, list) and len(val) > 0:
                    message = f"{key.capitalize()}: {val[0]}"
                else:
                    message = f"{key.capitalize()}: {val}"

        response.data = {
            "success": False,
            "status_code": response.status_code,
            "message": message,
            "errors": errors
        }
    else:
        # This handles server errors (500) that aren't caught by DRF
        logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
        
        # We only return custom 500 JSON if not in DEBUG mode, or we can return it as standard.
        # Let's return a structured response for client safety.
        from django.conf import settings
        if not settings.DEBUG:
            response = Response({
                "success": False,
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "message": "Internal Server Error. Please contact support.",
                "errors": {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response

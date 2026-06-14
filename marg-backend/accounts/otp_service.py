import random
from django.conf import settings
from django.core.cache import cache


class OTPService:
    """
    Handles generation, delivery, and verification of OTPs.
    In development mode (OTP_MOCK=True), the OTP is always '123456'.
    """

    @staticmethod
    def generate_otp(phone_number: str) -> str:
        """Generate a 6-digit OTP and cache it for 5 minutes."""
        if getattr(settings, 'AUTH_OTP_MOCK', False):
            otp = '123456'
        else:
            otp = str(random.randint(100000, 999999))
            # TODO: Integrate SMS gateway (e.g. MSG91, Twilio) here to send `otp`

        cache_key = f"otp_{phone_number}"
        cache.set(cache_key, otp, timeout=300)
        return otp

    @staticmethod
    def verify_otp(phone_number: str, otp: str) -> bool:
        """Verify the OTP matches the cached value for the given phone number."""
        if getattr(settings, 'AUTH_OTP_MOCK', False):
            return otp == '123456'

        cache_key = f"otp_{phone_number}"
        cached_otp = cache.get(cache_key)

        if cached_otp and cached_otp == otp:
            cache.delete(cache_key)
            return True

        return False

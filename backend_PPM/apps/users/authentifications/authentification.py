from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from rest_framework.authentication import BaseAuthentication
from django.contrib.auth.models import AnonymousUser

class ExternalUser(AnonymousUser):
    def __init__(self, token_key=None):
        self.id = None
        self.token = token_key
    @property
    def is_authenticated(self):
        return True
class HybridJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None
        token_str = raw_token.decode('utf-8') if isinstance(raw_token, bytes) else raw_token
        if '.' in token_str:
            try:
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token
            except (InvalidToken, AuthenticationFailed):
                raise

        if len(token_str) == 40:
            return ExternalUser(token_key=token_str), None
        raise InvalidToken("Format de jeton inconnu.")
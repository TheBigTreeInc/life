"""Trusted Social identity boundary for Life asynchronous matches.

This module deliberately does not validate bearer tokens itself: the Social
issuer's verification protocol and public keys must be provisioned externally.
Unverified request fields MUST NOT be passed to the command service.
"""
from dataclasses import dataclass
from typing import Callable

class IdentityRejected(ValueError):
    pass

@dataclass(frozen=True)
class VerifiedPrincipal:
    issuer: str
    subject: str
    audience: str

    def __post_init__(self):
        if not all(isinstance(x, str) and x.strip() for x in (self.issuer, self.subject, self.audience)):
            raise IdentityRejected('Incomplete verified principal')

class SocialIdentityBoundary:
    """Wrap an independently provisioned trusted Social token verifier.

    verifier(token) -> verified issuer/subject/audience claims. Never
    substitute an unsigned JWT decode or browser-provided identity fields.
    """
    def __init__(self, verifier: Callable, expected_issuer: str, audience='life-play'):
        if not callable(verifier) or not expected_issuer or not audience:
            raise ValueError('Trusted verifier, expected issuer and audience required')
        self._verify, self.issuer, self.audience = verifier, expected_issuer, audience

    def authenticate(self, token: str) -> VerifiedPrincipal:
        if not isinstance(token, str) or not token.strip():
            raise IdentityRejected('Missing access token')
        try:
            claims = self._verify(token)
        except Exception as exc:
            raise IdentityRejected('Social verification failed') from exc
        if not isinstance(claims, dict) or claims.get('iss') != self.issuer:
            raise IdentityRejected('Unexpected token issuer')
        audience = claims.get('aud')
        if not (audience == self.audience or isinstance(audience, list) and self.audience in audience):
            raise IdentityRejected('Token audience mismatch')
        subject=claims.get('sub')
        if not isinstance(subject,str) or not subject.strip():
            raise IdentityRejected('Invalid verified subject')
        return VerifiedPrincipal(self.issuer,subject,self.audience)

class AuthorizedAsyncCommandService:
    """Authenticate first, then delegate trusted issuer/subject to internal service."""
    def __init__(self, command_service, boundary: SocialIdentityBoundary):
        self.service, self.boundary = command_service, boundary

    def process(self, *, token, match_id, expected_revision, idempotency_key, command):
        identity=self.boundary.authenticate(token)
        return self.service.process(match_id=match_id, expected_revision=expected_revision,
            issuer=identity.issuer, subject=identity.subject,
            idempotency_key=idempotency_key, command=command)

class NotFoundError(Exception):
    """Maps to HTTP 404."""


class BadRequestError(Exception):
    """Maps to HTTP 400."""


class ServiceError(Exception):
    """Maps to HTTP 500."""

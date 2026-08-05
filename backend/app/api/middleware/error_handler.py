from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from ...core.exceptions import NotFoundError, BadRequestError, ServiceError


def _json_response(status_code: int, detail: str):
    return JSONResponse(status_code=status_code, content={"detail": detail})


def register_exception_handlers(app: FastAPI):
    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError):
        return _json_response(404, str(exc) or "Not found")

    @app.exception_handler(BadRequestError)
    async def bad_request_handler(request: Request, exc: BadRequestError):
        return _json_response(400, str(exc) or "Bad request")

    @app.exception_handler(ServiceError)
    async def service_error_handler(request: Request, exc: ServiceError):
        return _json_response(500, str(exc) or "Internal server error")

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return _json_response(400, str(exc) or "Invalid value")

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        return _json_response(500, str(exc) or "Internal server error")

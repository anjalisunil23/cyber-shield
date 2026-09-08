"""
Cyber Shield API entrypoint.

Interactive OpenAPI docs are available at /docs (Swagger UI) and /redoc.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes.auth import router as auth_router
from app.api.routes.admin import router as admin_router
from app.api.routes.cases import router as cases_router
from app.api.routes.evidence import router as evidence_router
from app.api.routes.modules import router as modules_router
from app.api.routes.platform import router as platform_router
from app.api.routes.rbac import router as rbac_router
from app.api.routes.chat import router as chat_router
from app.core.config import get_settings
from app.services.storage import ensure_upload_tree

settings = get_settings()
ensure_upload_tree()

app = FastAPI(
    title="CyberShield API",
    description="AI-ready investigation support platform — Phase 1 (no AI models)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


def _error_body(message: str) -> dict:
    return {"success": False, "message": message}


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict) and "message" in detail:
        body = {"success": False, "message": str(detail["message"])}
    elif isinstance(detail, str):
        body = _error_body(detail)
    else:
        body = _error_body("Request failed")
    return JSONResponse(status_code=exc.status_code, content=body, headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    errors = exc.errors()
    if errors:
        first = errors[0]
        loc = " -> ".join(str(p) for p in first.get("loc", []) if p != "body")
        msg = first.get("msg", "Validation error")
        message = f"{loc}: {msg}" if loc else msg
    else:
        message = "Validation error"
    return JSONResponse(status_code=422, content=_error_body(message))


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(_request: Request, _exc: SQLAlchemyError) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content=_error_body(
            "Database unavailable. Start PostgreSQL (e.g. docker compose up -d in backend/) then retry."
        ),
    )


app.include_router(auth_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(cases_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(modules_router, prefix="/api")
app.include_router(platform_router, prefix="/api")
app.include_router(rbac_router, prefix="/api")


@app.get("/")
def root() -> dict:
    return {
        "success": True,
        "message": "CyberShield API",
        "docs": "/docs",
        "health": "/api/health",
        "phase": 1,
    }


@app.get("/api/health")
def health() -> dict:
    return {"success": True, "message": "ok"}

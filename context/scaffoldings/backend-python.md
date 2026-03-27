# Scaffolding — Servicio Backend Python (Validador OCPI)

## Estructura del Proyecto

```
ocpi-validator/
├── src/
│   └── ocpi_validator/
│       ├── __init__.py
│       ├── main.py              # FastAPI app entrypoint
│       ├── config.py            # Settings (pydantic-settings, OCI Vault)
│       ├── domain/
│       │   ├── models.py        # OCPI domain models (Pydantic v2)
│       │   ├── schemas.py       # OCPI 2.2.1 validation schemas
│       │   ├── rules.py         # Business validation rules
│       │   └── errors.py        # Domain errors
│       ├── api/
│       │   ├── router.py        # FastAPI router
│       │   ├── handlers.py      # Endpoint handlers
│       │   ├── middleware.py     # Correlation ID, logging, error handling
│       │   └── dependencies.py  # FastAPI dependency injection
│       ├── services/
│       │   └── validator.py     # Validation orchestration
│       ├── adapters/
│       │   ├── kafka.py         # Kafka consumer/producer (aiokafka)
│       │   ├── database.py      # SQLAlchemy async + asyncpg
│       │   └── redis.py         # Redis async client
│       └── observability/
│           ├── tracing.py       # OpenTelemetry setup
│           ├── metrics.py       # Prometheus metrics
│           └── logging.py       # Structured logging (structlog)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── alembic/                     # DB migrations
├── Dockerfile
├── pyproject.toml
├── Makefile
└── README.md
```

---

## Patrones de Código

### main.py — FastAPI con Lifespan

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import structlog

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = Settings()
    logger.info("starting ocpi-validator", version=settings.version)
    tracer_provider = init_tracing(settings.otlp_endpoint, "ocpi-validator")
    yield
    logger.info("shutting down ocpi-validator")
    tracer_provider.shutdown()

app = FastAPI(title="UPME OCPI Validator", version="1.0.0", lifespan=lifespan)
app.add_middleware(StructuredLoggingMiddleware)
app.add_middleware(CorrelationIDMiddleware)
app.include_router(router, prefix="/validate")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### Pydantic v2 — OCPI 2.2.1 Models

```python
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from enum import Enum

class EVSEStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    CHARGING = "CHARGING"
    OUT_OF_ORDER = "OUTOFORDER"

class GeoLocation(BaseModel):
    latitude: float = Field(..., ge=-4.23, le=13.39)
    longitude: float = Field(..., ge=-81.73, le=-66.85)

class EVSE(BaseModel):
    uid: str = Field(..., min_length=1, max_length=39)
    status: EVSEStatus
    connectors: list[Connector] = Field(..., min_length=1)
    last_updated: datetime

class LocationUpdate(BaseModel):
    id: str = Field(..., min_length=1, max_length=39)
    name: str = Field(..., min_length=1, max_length=255)
    coordinates: GeoLocation
    evses: list[EVSE] = Field(..., min_length=1)
    last_updated: datetime

    @field_validator("last_updated")
    @classmethod
    def validate_not_future(cls, v):
        from datetime import timezone, timedelta
        if v > datetime.now(timezone.utc) + timedelta(minutes=5):
            raise ValueError("Timestamp cannot be in the future")
        return v
```

### Validation Pipeline

```python
class OCPIValidationService:
    def __init__(self, rules: list[ValidationRule]):
        self.rules = rules

    async def validate_location(self, data: LocationUpdate, context: ValidationContext) -> ValidationResult:
        errors = []
        for rule in self.rules:
            rule_errors = await rule.validate(data, context)
            errors.extend(rule_errors)
        return ValidationResult(valid=len(errors) == 0, errors=errors)
```

### Structured Logging

```python
import structlog

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
)

logger = structlog.get_logger()
logger.info("ocpi_validation_complete", cpo_id=cpo_id, valid=True, duration_ms=45)
```

---

## Dockerfile

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY src/ ./src/
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8080
USER nobody:nogroup
CMD ["uvicorn", "ocpi_validator.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

## Dependencias Clave

| Paquete | Propósito |
|---------|-----------|
| `fastapi` | Web framework async |
| `uvicorn` | ASGI server |
| `pydantic>=2.0` | Data validation, OCPI schemas |
| `pydantic-settings` | Config from env/vault |
| `structlog` | Structured logging |
| `opentelemetry-sdk` | Tracing + metrics |
| `aiokafka` | Async Kafka |
| `asyncpg` | Async PostgreSQL |
| `sqlalchemy[async]` | ORM async |
| `redis[async]` | Async Redis |
| `pytest` + `pytest-asyncio` | Testing |
| `hypothesis` | Property-based testing |
| `ruff` | Linter + formatter |
| `mypy` | Type checking |

# Estándares de Código y Calidad

## Checklist de Código — Toda Propuesta

```
□ Tests unitarios incluidos (cobertura > 80%)
□ Manejo de errores explícito (no swallow errors)
□ Logging estructurado (JSON, con correlation ID)
□ Métricas de observabilidad (latencia, errores, saturación)
□ Input validation (Zod en frontend, Pydantic/jsonschema en backend)
□ Secrets en Vault — nunca hardcodeados
□ Documentación de API (OpenAPI 3.1)
□ Backward compatibility verificada
□ Performance considerada (¿necesita caché? ¿índice? ¿paginación?)
□ Idempotencia en operaciones de escritura
```

## Checklist de Arquitectura — Toda Decisión

```
□ ADR documentado (plantilla: context/templates/adr.md)
□ Diagrama C4 actualizado (Structurizr DSL)
□ Diagrama de secuencia del flujo principal (Mermaid)
□ Análisis de failure modes (¿qué pasa si X falla?)
□ Plan de rollback
□ Impacto en DRP
□ Impacto en CI/CD pipeline
□ Impacto en observabilidad
```

---

## Convenciones de Idioma

| Ámbito | Idioma | Ejemplo |
|--------|--------|---------|
| Documentación (specs, entregables) | Español | "Guía de Integración CPO" |
| Código fuente | Inglés | `func ValidateLocation()` |
| Comentarios en código | Inglés | `// Validate OCPI schema` |
| Nombres de variables/funciones | Inglés | `cpoStatus`, `locationId` |
| Commits | Inglés | `feat: add OCPI location validation` |
| Nombres de archivos de código | Inglés | `validator.go`, `schemas.py` |
| Nombres de archivos de docs | Español | `guia-integracion-cpo.md` |

---

## Go — Estándares de Código

### Estilo y Formato
- `gofmt` obligatorio (enforced en CI)
- `golangci-lint` con config del proyecto
- Effective Go como referencia

### Patrones Obligatorios

```go
// Error handling — SIEMPRE verificar errores
result, err := someFunction()
if err != nil {
    return fmt.Errorf("context: %w", err) // Wrap con contexto
}

// Structured logging — slog (stdlib)
slog.Info("location updated",
    "cpo_id", cpoID,
    "location_id", locationID,
    "correlation_id", correlationID,
)

// Context propagation — SIEMPRE como primer parámetro
func ProcessLocation(ctx context.Context, loc *Location) error {
    // Extract trace context, correlation ID from ctx
}

// Graceful shutdown
ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer cancel()
```

### Concurrencia
- Usar `errgroup` para operaciones paralelas con error handling
- Evitar goroutine leaks (siempre con context cancellation)
- Connection pooling explícito (pgx, go-redis)
- Rate limiting con `golang.org/x/time/rate`

### Testing
- Table-driven tests como estándar
- `testify` para assertions
- `testcontainers-go` para integration tests (DB, Redis, Kafka)
- Benchmarks para hot paths (`go test -bench`)

---

## Python — Estándares de Código

### Estilo y Formato
- `ruff` como linter y formatter (reemplaza black, isort, flake8)
- `mypy` para type checking estricto
- Type hints obligatorios en funciones públicas

### Patrones Obligatorios

```python
# Pydantic v2 para modelos y validación
from pydantic import BaseModel, Field

class LocationUpdate(BaseModel):
    location_id: str = Field(..., min_length=1, max_length=39)
    name: str = Field(..., min_length=1, max_length=255)
    coordinates: Coordinates
    evses: list[EVSE] = Field(..., min_length=1)

# Structured logging — structlog
import structlog
logger = structlog.get_logger()

logger.info("ocpi_validation_complete",
    cpo_id=cpo_id,
    location_id=location_id,
    correlation_id=correlation_id,
    valid=True,
)

# Async por defecto (FastAPI + uvicorn)
async def validate_location(location: LocationUpdate) -> ValidationResult:
    ...
```

### Testing
- `pytest` como framework
- `pytest-asyncio` para tests async
- `factory_boy` para test data
- `hypothesis` para property-based testing (schemas OCPI)

---

## TypeScript/React — Estándares de Código

### Estilo y Formato
- ESLint + Prettier (config del proyecto)
- `strict: true` en tsconfig
- No `any` — usar tipos específicos o `unknown`

### Patrones Obligatorios

```typescript
// Zod para validación de input (forms, API responses)
import { z } from 'zod';

const LocationSchema = z.object({
  id: z.string().min(1).max(39),
  name: z.string().min(1).max(255),
  coordinates: CoordinatesSchema,
  evses: z.array(EVSESchema).min(1),
});

// TanStack Query para server state
const { data, isLoading, error } = useQuery({
  queryKey: ['stations', filters],
  queryFn: () => api.getStations(filters),
  staleTime: 30_000, // 30s
});

// Error boundaries obligatorios en cada feature
<ErrorBoundary fallback={<ErrorFallback />}>
  <StationMap />
</ErrorBoundary>
```

### Componentes
- Feature-based folder structure (no por tipo)
- shadcn/ui como base de componentes UI
- Accesibilidad WCAG 2.1 AA mínimo
- Lazy loading para rutas

---

## Error Handling

### Principios
1. **Fail fast** — Validar input lo antes posible
2. **No swallow errors** — Siempre log + propagar o manejar
3. **Error context** — Wrap errors con contexto del dominio
4. **User-friendly responses** — RFC 9457 Problem Details para APIs

### Formato de Error Response (RFC 9457)

```json
{
  "type": "https://api.upme.gov.co/errors/validation-failed",
  "title": "OCPI Validation Failed",
  "status": 400,
  "detail": "Location coordinates are outside Colombia boundaries",
  "instance": "/ocpi/2.2.1/locations/LOC001",
  "correlation_id": "abc-123-def",
  "errors": [
    {
      "field": "coordinates.latitude",
      "message": "Must be between -4.23 and 13.39 (Colombia)"
    }
  ]
}
```

---

## Logging Estructurado

### Formato (JSON)

```json
{
  "timestamp": "2026-03-26T14:30:00.123Z",
  "level": "INFO",
  "service": "ingesta-service",
  "correlation_id": "abc-123-def",
  "cpo_id": "CPO-ENEL-001",
  "message": "Location updated successfully",
  "duration_ms": 45,
  "module": "locations",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736"
}
```

### Campos Obligatorios

| Campo | Tipo | Siempre | Descripción |
|-------|------|---------|-------------|
| `timestamp` | ISO 8601 | Si | Momento del evento |
| `level` | string | Si | ERROR, WARN, INFO, DEBUG |
| `service` | string | Si | Nombre del microservicio |
| `correlation_id` | UUID | Si | ID de correlación end-to-end |
| `message` | string | Si | Descripción del evento |
| `cpo_id` | string | Si CPO | Identificador del CPO |
| `trace_id` | string | Si OTel | OpenTelemetry trace ID |
| `duration_ms` | number | Si timing | Duración de la operación |
| `error` | string | Si error | Mensaje de error |
| `stack_trace` | string | Si error | Stack trace (solo en ERROR) |

### Reglas de PII en Logs
- **NUNCA** loggear: passwords, tokens, certificados, emails personales
- **Enmascarar**: nombres de personas, IPs de usuarios finales
- **Permitido**: CPO IDs, location IDs, correlation IDs, métricas

---

## Estrategia de Testing

| Nivel | Herramientas | Cobertura | Cuándo |
|-------|-------------|-----------|--------|
| **Unit** | Go: testing + testify / Python: pytest / TS: vitest | > 80% | Cada commit |
| **Integration** | testcontainers (DB, Redis, Kafka) | Flujos principales | Cada PR |
| **Contract** | Dredd, Schemathesis (OpenAPI vs implementación) | 100% endpoints | Cada PR |
| **E2E** | Playwright (frontend), k6 (API) | Happy paths + errores principales | Pre-release |
| **Performance** | k6, Go benchmarks | Hot paths, SLOs | Pre-release |
| **Chaos** | Litmus Chaos | Resiliencia (kill pod, network partition) | Trimestral |
| **Security** | SonarQube (SAST), OWASP ZAP (DAST) | Todo código / APIs expuestas | Cada commit / Pre-release |

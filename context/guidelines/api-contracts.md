# Contratos de API — Contract-First Design

## Principios Contract-First

1. **El contrato se diseña PRIMERO** — antes de cualquier línea de código de implementación
2. **El contrato es el source of truth** — la implementación se genera/valida contra él
3. **Versionado semántico** — `/ocpi/2.2.1/`, `/api/v1/`, `/public/v1/`
4. **Backward compatibility** — cambios breaking requieren nueva versión major
5. **El contrato se publica** — Developer Portal accesible para CPOs

---

## Estándar OpenAPI 3.1

Todos los contratos DEBEN usar OpenAPI 3.1. Template base:

```yaml
openapi: "3.1.0"
info:
  title: "UPME Plataforma de Interoperabilidad — API OCPI"
  description: |
    API de interoperabilidad de estaciones de carga eléctrica.
    Cumple con OCPI 2.2.1 y Resolución 40559/2025 MinEnergía.
  version: "2.2.1"
  contact:
    name: "UPME — Equipo de Interoperabilidad"
    email: "interoperabilidad@upme.gov.co"
  license:
    name: "Gobierno de Colombia — Uso restringido"
servers:
  - url: "https://sandbox.interoperabilidad.upme.gov.co/ocpi/2.2.1"
    description: "Sandbox (pruebas CPO)"
  - url: "https://api.interoperabilidad.upme.gov.co/ocpi/2.2.1"
    description: "Producción"
security:
  - OAuth2ClientCredentials: ["cpo:write"]
  - mTLS: []
paths:
  /locations:
    put:
      operationId: updateLocations
      summary: "Actualizar información de estaciones de carga"
      description: |
        CPO reporta o actualiza la información de sus estaciones.
        Requiere autenticación OAuth 2.1 + mTLS.
        Rate limit aplicado según tier del CPO.
      tags: [Locations]
      security:
        - OAuth2ClientCredentials: ["cpo:write"]
        - mTLS: []
      parameters:
        - $ref: "#/components/parameters/X-Correlation-ID"
        - $ref: "#/components/parameters/X-Request-ID"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/LocationUpdate"
      responses:
        "202":
          description: "Accepted — Datos encolados para procesamiento"
          headers:
            X-Correlation-ID:
              $ref: "#/components/headers/X-Correlation-ID"
            X-RateLimit-Limit:
              $ref: "#/components/headers/X-RateLimit-Limit"
            X-RateLimit-Remaining:
              $ref: "#/components/headers/X-RateLimit-Remaining"
        "400":
          $ref: "#/components/responses/ValidationError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "429":
          $ref: "#/components/responses/RateLimited"
components:
  securitySchemes:
    OAuth2ClientCredentials:
      type: oauth2
      flows:
        clientCredentials:
          tokenUrl: "https://auth.interoperabilidad.upme.gov.co/realms/upme-cpo/protocol/openid-connect/token"
          scopes:
            "cpo:write": "Reportar datos de estaciones"
            "cpo:read": "Consultar datos propios"
    mTLS:
      type: mutualTLS
      description: "Certificado X.509 emitido por CA UPME"
  parameters:
    X-Correlation-ID:
      name: X-Correlation-ID
      in: header
      required: false
      schema:
        type: string
        format: uuid
      description: "ID de correlación para trazabilidad end-to-end"
    X-Request-ID:
      name: X-Request-ID
      in: header
      required: true
      schema:
        type: string
        format: uuid
      description: "ID único de request (idempotencia)"
```

---

## Error Responses — RFC 9457

Todas las respuestas de error DEBEN seguir RFC 9457 (Problem Details for HTTP APIs):

```json
{
  "type": "https://api.upme.gov.co/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "El payload OCPI no cumple con el schema de Locations",
  "instance": "/ocpi/2.2.1/locations",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Paginación — Cursor-Based

Para colecciones grandes, usar paginación cursor-based:

```
GET /api/v1/stations?cursor=eyJpZCI6MTIzfQ&limit=50

Response:
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTczfQ",
    "has_more": true,
    "total": 612
  }
}
```

## Response Headers Estándar

| Header | Descripción | Ejemplo |
|--------|------------|---------|
| `X-Correlation-ID` | ID de correlación end-to-end | `550e8400-...` |
| `X-Request-ID` | ID único del request (echo back) | `660f9500-...` |
| `X-RateLimit-Limit` | Límite de requests por ventana | `300` |
| `X-RateLimit-Remaining` | Requests restantes | `245` |
| `X-RateLimit-Reset` | Segundos hasta reset del counter | `42` |

---

## Governance de Contratos

```
□ Todo endpoint tiene contrato OpenAPI 3.1 ANTES de implementarse
□ Contratos versionados en el repositorio (specs/openapi/)
□ Validación automática en CI: spectral lint + schema validation
□ Breaking changes detectados automáticamente (oasdiff en pipeline)
□ Contratos publicados en Developer Portal (Swagger UI / Redoc)
□ Mocking disponible para CPOs (Prism mock server en Sandbox)
□ Ejemplos (examples) incluidos en cada operación del contrato
□ Error responses estandarizados (RFC 9457)
□ Paginación estandarizada (cursor-based para colecciones grandes)
□ Headers de respuesta estandarizados (rate limit, correlation ID)
□ SDK auto-generado para CPOs (openapi-generator: Go, Python, Java, .NET)
□ Changelog de API publicado con cada release
□ Deprecation policy: mínimo 6 meses de aviso antes de retirar versión
```

---

## Herramientas del Ecosistema API

| Herramienta | Propósito | Fase |
|-------------|-----------|------|
| **Swagger Editor / Stoplight Studio** | Diseño visual de contratos OpenAPI | Diseño |
| **Spectral** | Linting de OpenAPI (custom rules UPME) | CI |
| **oasdiff** | Detección de breaking changes entre versiones | CI |
| **Prism** | Mock server basado en contrato (para Sandbox) | Testing |
| **openapi-generator** | Generación de SDKs para CPOs | Release |
| **Redoc / Swagger UI** | Developer Portal — documentación interactiva | Portal |
| **Dredd / Schemathesis** | Contract testing (spec vs implementación) | CI/CD |
| **k6 + openapi-to-k6** | Performance testing basado en contrato | QA |
| **Postman / Bruno** | Colecciones de testing manual para CPOs | Sandbox |

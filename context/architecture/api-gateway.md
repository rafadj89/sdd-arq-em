# API Gateway — Diseño y Contratos

## Filosofía

_"API-First, Contract-First, Security-First"_ — El contrato de la API es el artefacto más importante del sistema. Se diseña ANTES de implementar. Se versiona. Se valida. Se publica.

---

## Arquitectura del API Gateway

```
                    ┌─────────────────────────────────────────────┐
                    │              OCI WAF (L7)                    │
                    │  OWASP Top 10 │ DDoS │ Bot Detection │ GeoIP│
                    └──────────────────┬──────────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────────┐
                    │           OCI Load Balancer                  │
                    │     TLS 1.3 Termination │ Health Checks      │
                    └──────────────────┬──────────────────────────┘
                                       │
         ┌─────────────────────────────▼─────────────────────────────────┐
         │                      API GATEWAY                              │
         │                                                               │
         │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
         │  │  mTLS   │→ │  OAuth   │→ │   Rate   │→ │   Request    │  │
         │  │ Verify  │  │2.1+DPoP  │  │ Limiting │  │  Transform   │  │
         │  │         │  │  + JWT   │  │ (by CPO  │  │  + Routing   │  │
         │  │ (CPOs)  │  │ Validate │  │   tier)  │  │              │  │
         │  └─────────┘  └──────────┘  └──────────┘  └──────────────┘  │
         │                                                               │
         │  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐    │
         │  │  Correlation  │  │   Request   │  │    Response      │    │
         │  │  ID Inject    │  │   Logging   │  │    Caching       │    │
         │  └──────────────┘  └─────────────┘  └──────────────────┘    │
         └───────────────────────────┬───────────────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
     ┌──────────────┐     ┌──────────────┐      ┌──────────────┐
     │  /ocpi/2.2.1 │     │   /api/v1    │      │   /public    │
     │  (CPO APIs)  │     │ (Admin APIs) │      │ (Open Data)  │
     │  Go Ingesta  │     │ Go/Python    │      │  Go (cache)  │
     └──────────────┘     └──────────────┘      └──────────────┘
```

---

## Evaluación de Tecnologías (PoC Obligatorio)

| Criterio | OCI API Gateway | Kong (OSS/Enterprise) | Apache APISIX | Traefik |
|----------|----------------|----------------------|---------------|----------|
| **Managed/Self-hosted** | Managed OCI | Self-hosted en OKE | Self-hosted en OKE | Self-hosted en OKE |
| **OAuth 2.1/JWT** | JWT validation nativo | Plugin OAuth2 + JWT | Plugin OAuth2 + JWT | Middleware JWT |
| **mTLS** | Soportado | Soportado + client cert | Soportado | Soportado |
| **Rate Limiting** | Básico (por IP/path) | Avanzado (por consumer, header, custom) | Avanzado (multi-policy) | Básico |
| **Transformación** | Limitada | Plugins Lua/Go | Plugins Lua/Wasm | Middleware |
| **OpenAPI import** | Sí (deployment directo) | Sí (deck sync) | Sí (import) | No nativo |
| **Observabilidad** | OCI Monitoring nativo | Prometheus + Grafana | Prometheus + Grafana | Prometheus |
| **Costo** | Incluido en OCI | Licencia Enterprise o OSS | OSS gratuito | OSS gratuito |
| **Soporte OCI** | Nativo, IAM integrado | Community/Enterprise | Community | Community |
| **Canary/Blue-Green** | No nativo | Sí (plugin traffic) | Sí (plugin traffic) | Sí (weighted) |
| **DPoP validation** | Custom authorizer | Plugin custom (Lua/Go) | Plugin custom | Middleware custom |

### Metodología de PoC

```markdown
## PoC: Evaluación API Gateway — [Tecnología]

### Objetivo
Validar [tecnología] para exposición pública de APIs OCPI 2.2.1

### Criterios de aceptación
1. JWT RS256 validation < 5ms P99
2. mTLS handshake < 50ms P99
3. Rate limiting preciso (±5% de accuracy)
4. Throughput ≥ 5,000 req/s con latencia < 10ms added
5. Failover sin downtime (kill pod → recovery < 5s)
6. OpenAPI 3.1 spec importable y auto-configurable
7. Logging estructurado con correlation ID propagado
8. DPoP proof validation funcional

### Escenario de prueba
- 100 CPOs simulados con diferentes tiers de rate limiting
- Payloads OCPI reales (Locations, Sessions, CDRs)
- Test de carga: k6 con ramp-up 0→5000 req/s en 5 min
- Chaos test: pod kill, network partition, Redis down

### Métricas a capturar
- Latencia añadida por el gateway (P50, P95, P99)
- CPU/Memory bajo carga
- Error rate bajo stress
- Recovery time tras failure

### Entregables
- Informe comparativo con métricas
- Recomendación con justificación
- ADR documentado
- Config as code (Terraform/Helm) del ganador
```

---

## Rutas y Políticas

| Ruta | Método | Auth | Rate Limit | Caché | Backend |
|------|--------|------|------------|-------|---------|
| `/ocpi/2.2.1/locations` | PUT | mTLS + OAuth 2.1 + DPoP (`cpo:write`) | Por tier CPO | No | Ingesta (Go) |
| `/ocpi/2.2.1/locations` | GET | mTLS + OAuth 2.1 (`cpo:read`) | 300/min | 60s | Query Service |
| `/ocpi/2.2.1/sessions` | PUT | mTLS + OAuth 2.1 + DPoP (`cpo:write`) | Por tier CPO | No | Ingesta (Go) |
| `/ocpi/2.2.1/cdrs` | POST | mTLS + OAuth 2.1 + DPoP (`cpo:write`) | Por tier CPO | No | Ingesta (Go) |
| `/api/v1/dashboard` | GET | OAuth 2.1 + PKCE (`admin:read`) | 100/min | 30s | Admin Service |
| `/api/v1/cpos` | GET/POST | OAuth 2.1 + PKCE (`admin:full`) | 60/min | No | CPO Service |
| `/public/v1/stations` | GET | API Key o anónimo | 600/min | 30s | Public Service |
| `/public/v1/prices` | GET | API Key o anónimo | 600/min | 30s | Public Service |
| `/health` | GET | Ninguna | No limit | No | Health Check |
| `/.well-known/openapi.json` | GET | Ninguna | 60/min | 1h | Static |

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

---

## Checklist de API Gateway

Aplicar a **TODA** propuesta de exposición de APIs:

```
□ ¿El contrato OpenAPI 3.1 existe y está aprobado?
□ ¿La ruta requiere autenticación? → OAuth 2.1 + mTLS (CPOs) o OAuth 2.1 + PKCE (Portal)
□ ¿Rate limiting configurado por ruta Y por consumidor?
□ ¿Request validation activa en el gateway (schema validation)?
□ ¿Response caching habilitado donde aplique? (TTL documentado)
□ ¿Correlation ID propagado end-to-end?
□ ¿Error responses siguen RFC 9457 (Problem Details)?
□ ¿Logging estructurado habilitado (request/response sin PII)?
□ ¿CORS configurado restrictivamente (no wildcard origins)?
□ ¿Timeouts configurados (connection: 5s, read: 30s, write: 30s)?
□ ¿Circuit breaker configurado hacia backends?
□ ¿Health check del backend configurado en el gateway?
□ ¿Métricas de observabilidad: latencia, error rate, throughput por ruta?
□ ¿Backward compatibility verificada con versión anterior del contrato?
□ ¿Documentación actualizada en Developer Portal?
```

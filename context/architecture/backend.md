# Arquitectura Backend — Patrones y Diseño

## Principios de Arquitectura

Estos principios aplican a **TODA** decisión de diseño e implementación:

| Principio | Aplicación en UPME |
|-----------|-------------------|
| **SOLID** | Interfaces claras entre servicios, responsabilidad única por microservicio |
| **DRY** | Shared libraries para logging, tracing, error handling |
| **KISS** | Evitar sobre-ingeniería; la solución más simple que cumpla requisitos |
| **YAGNI** | No implementar features especulativas |
| **12-Factor App** | Config por env vars (OCI Vault), logs a stdout, stateless |
| **Separation of Concerns** | Ingesta (Go) vs Validación (Python) vs Streaming (Kafka) |
| **Fail-fast, fail-safe** | Validar temprano, circuit breakers en dependencias externas |
| **Design for failure** | Todo componente externo es no confiable (Cárgame, Redis, DB) |
| **Observability-first** | Si no se puede medir, no existe |
| **Security by design** | No es un add-on, es fundacional |
| **API-first** | Contratos OpenAPI antes que implementación |
| **IaC** | Nada se provisiona manualmente (Terraform + ArgoCD) |
| **Zero-trust** | Todo tráfico se autentica y autoriza, incluso interno |

---

## Domain-Driven Design (DDD)

### Aggregates Principales

| Aggregate | Root Entity | Bounded Context | Invariantes |
|-----------|------------|-----------------|-------------|
| `Location` | Location | OCPI Core | Coordenadas válidas, al menos 1 EVSE, CPO owner verificado |
| `EVSE` | EVSE | OCPI Core | Status válido, conectores con estándar definido |
| `Session` | ChargingSession | OCPI Core | Timestamps coherentes, EVSE existente, CPO activo |
| `CDR` | ChargeDetailRecord | OCPI Core | Energía >= 0, costo calculado correctamente, sesión cerrada |
| `Tariff` | Tariff | OCPI Core | Precio >= 0, moneda COP, vigencia definida |
| `CPO` | CPORegistration | CPO Management | Estado Cárgame verificado, credenciales vigentes |

### Domain Events

```
# CPO Management
CPORegistrationRequested → triggers: Cárgame validation
CPOValidated → triggers: credential issuance
CPOCertified → triggers: production access
CPOSuspended → triggers: credential revocation, data freeze

# OCPI Core
LocationUpdated → triggers: cache invalidation, public data refresh
SessionStarted → triggers: real-time dashboard update
SessionCompleted → triggers: CDR generation
CDRCreated → triggers: Data Lake Bronze write, anomaly check
TariffChanged → triggers: public price update, anomaly check

# Integration
CargameValidationCompleted → triggers: CPO state transition
CargameUnavailable → triggers: circuit breaker activation, cache fallback
```

### Anti-Corruption Layer (ACL) — Cárgame

```
UPME Domain ←→ ACL ←→ Cárgame External API
                │
                ├── Traduce modelos de Cárgame a modelos UPME
                ├── Maneja estados diferentes (ACTIVE/INACTIVE → nuestro enum)
                ├── Circuit breaker si Cárgame no responde
                ├── Caché de respuestas (Redis, TTL 24h)
                └── Retry con backoff exponencial
```

---

## Arquitectura de Microservicios

### Descomposición por Dominio

| Servicio | Lenguaje | Responsabilidad | Comunicación |
|----------|----------|-----------------|-------------|
| **Ingesta Service** | Go 1.22+ | Recepción de datos OCPI, validación inicial, encolamiento | Sync (HTTP) + Async (Kafka produce) |
| **OCPI Validator** | Python 3.12+ | Validación de schemas OCPI 2.2.1, reglas de negocio | Sync (gRPC/HTTP llamado por Ingesta) |
| **CPO Service** | Go | Gestión ciclo de vida CPO, integración Cárgame | Sync (HTTP) + Async (Kafka) |
| **Query Service** | Go | Consultas de datos operacionales (CPOs, admin) | Sync (HTTP) |
| **Public Service** | Go | API Open Data (ciudadanos), datos cacheados | Sync (HTTP), caché Redis |
| **Notification Service** | Go/Python | Webhooks, alertas, notificaciones RT | Async (Kafka consume) |
| **ETL/Pipeline Service** | Python | Transformaciones Bronze→Silver→Gold, calidad | Batch (OCI Data Flow) |

### Patrones de Comunicación

#### Sync (Request-Response)
- **HTTP REST** — APIs públicas (CPOs, portal, Open Data)
- **gRPC** — Comunicación interna (Ingesta → Validador) — mayor performance
- **Circuit Breaker** — Todas las llamadas sync a servicios externos (Cárgame, KeyCloak)
- **Bulkhead** — Pools de conexiones separados por dependencia
- **Retry** — Backoff exponencial con jitter, máximo 3 intentos

#### Async (Event-Driven)
- **Kafka/OCI Streaming** — Eventos de dominio entre servicios
- **Choreography** — Preferido para flujos simples (Location updated → cache invalidated → public data refreshed)
- **Saga (Orchestration)** — Para flujos complejos (CPO Certification: validate → issue creds → configure sandbox → notify)
- **DLQ (Dead Letter Queue)** — OCI Queue para mensajes que fallan tras N reintentos
- **Idempotencia** — Request ID como clave de idempotencia; deduplicación en consumer

### Event-Driven Architecture (EDA)

```
Productor (Go)                    Kafka/OCI Streaming                  Consumidor(es)
─────────────                    ───────────────────                  ──────────────
                                 ┌─────────────────┐
Ingesta Service ──publish──────► │ ocpi.locations   │ ──consume──► Query Service (update cache)
                                 │                  │ ──consume──► Data Lake Writer (Bronze)
                                 │                  │ ──consume──► Anomaly Detector
                                 └─────────────────┘
                                 ┌─────────────────┐
Ingesta Service ──publish──────► │ ocpi.sessions    │ ──consume──► Dashboard RT
                                 │                  │ ──consume──► Data Lake Writer
                                 └─────────────────┘
                                 ┌─────────────────┐
CPO Service ────publish────────► │ cpo.lifecycle    │ ──consume──► Notification Service
                                 │                  │ ──consume──► KeyCloak Provisioner
                                 └─────────────────┘
                                 ┌─────────────────┐
Any Service ────publish────────► │ system.dlq       │ ──consume──► DLQ Processor (alerta + retry)
                                 └─────────────────┘
```

#### Garantías de Entrega

| Garantía | Implementación |
|----------|---------------|
| **At-least-once** | Default en Kafka consumers; deduplicación por Request ID en consumer |
| **Exactly-once (semántica)** | Idempotency key + transactional outbox pattern |
| **Ordering** | Partición por CPO ID → eventos de un CPO siempre en orden |
| **DLQ** | Tras 3 reintentos fallidos → DLQ con metadata para investigación |

---

## Patrones de Integración

### Circuit Breaker (Cárgame, KeyCloak, Redis)

```
Estado: CLOSED → OPEN → HALF_OPEN → CLOSED

Configuración:
- Failure threshold: 5 fallos consecutivos → OPEN
- Open duration: 30 segundos
- Half-open: permite 1 request de prueba
- Si prueba OK → CLOSED
- Si prueba falla → OPEN (reset timer)

Fallback cuando OPEN:
- Cárgame: usar caché Redis (TTL 24h)
- KeyCloak: rechazar request (fail-safe)
- Redis: ir directo a base de datos
```

### Retry con Backoff Exponencial

```
Intento 1: inmediato
Intento 2: 500ms + jitter(0-100ms)
Intento 3: 2000ms + jitter(0-200ms)
Máximo: 3 intentos
Si falla: DLQ + alerta
```

---

## Servicios Go — Especificaciones

### Ingesta Service (Go 1.22+)

**Responsabilidad:** Punto de entrada para datos OCPI de CPOs. Alta concurrencia, baja latencia.

**Características:**
- HTTP server con Chi/Echo router
- Goroutines para procesamiento concurrente
- Connection pooling: pgx para PostgreSQL, go-redis para Redis
- Kafka producer con confluent-kafka-go
- Structured logging con slog (stdlib)
- OpenTelemetry SDK para tracing y métricas
- Graceful shutdown con signal handling
- Health/readiness probes

**SLOs target:**
- Latencia P99 < 500ms
- Throughput > 5,000 req/s
- Error rate < 0.1%

> **Scaffolding completo:** [`../scaffoldings/backend-go.md`](../scaffoldings/backend-go.md)

---

## Servicios Python — Especificaciones

### Validador OCPI (Python 3.12+)

**Responsabilidad:** Validación profunda de datos OCPI. Schemas JSON + reglas de negocio.

**Características:**
- FastAPI con uvicorn (async)
- Pydantic v2 para modelos y validación
- Schemas OCPI 2.2.1 como Pydantic models
- Reglas de negocio como cadena de validadores
- Structured logging con structlog
- OpenTelemetry SDK
- Async Kafka consumer (aiokafka) para validación batch

**SLOs target:**
- Latencia P99 < 200ms (por validación)
- Schema validation accuracy: 100%

> **Scaffolding completo:** [`../scaffoldings/backend-python.md`](../scaffoldings/backend-python.md)

---

## Formato de Evaluación de Alternativas

Usar esta plantilla para TODA evaluación técnica:

```markdown
## Evaluación: [Problema a resolver]

| Criterio | Peso | Opción A | Opción B | Opción C |
|----------|------|----------|----------|----------|
| Madurez/Comunidad | 15% | | | |
| Performance | 20% | | | |
| Seguridad | 20% | | | |
| Costo operativo | 15% | | | |
| Curva de aprendizaje | 10% | | | |
| Soporte OCI nativo | 10% | | | |
| Cumplimiento regulatorio | 10% | | | |
| **Score ponderado** | **100%** | | | |

**Recomendación:** [Opción X] porque...
**Riesgos:** ...
**Plan de migración si falla:** ...
```

> **Plantilla completa:** [`../templates/evaluation.md`](../templates/evaluation.md)

---

## Diagramas Técnicos — Formato

| Tipo | Herramienta | Uso |
|------|-------------|-----|
| **Secuencia** | Mermaid | Flujos de autenticación, ingesta, validación |
| **Estados** | Mermaid | Ciclo de vida CPO, estados de sesión |
| **Componentes** | Structurizr DSL | Interacción entre microservicios (C4) |
| **Despliegue** | Structurizr DSL / Mermaid | Topología OCI, OKE |
| **Clases** | Mermaid | Modelos de dominio, DTOs |

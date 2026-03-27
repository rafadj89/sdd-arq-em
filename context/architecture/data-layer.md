# Capa de Datos — Base de Datos, Data Lake, Redis

## Volumetría de Referencia

| Métrica | Valor | Notas |
|---------|-------|-------|
| Estaciones | ~600 | Crecimiento +30% anual |
| Conectores/estación | ~5 | Promedio |
| Frecuencia de reporte | 1/60s por conector | Mandatorio Resolución 40559 |
| Reportes/segundo | ~50 | Steady state |
| Reportes/minuto | ~3,000 | Steady state |
| Transacciones/mes | 21.6M | Pico proyectado |
| Retención caliente | 90 días | ~648M registros |
| Crecimiento anual | +30% | En estaciones activas |

---

## OCI Autonomous Database (ATP)

### Configuración

| Parámetro | Valor | Justificación |
|-----------|-------|---------------|
| Tipo | ATP (Transaction Processing) | Optimizado para OLTP |
| Version | Oracle 23ai | JSON Relational Duality, AI Vector Search |
| Auto-scaling | Habilitado (1-4 OCPUs) | Absorber picos de carga |
| Data Guard | Active Standby, Maximum Availability | RPO ~0, RTO < 30min |
| Backup | Automático, retención 60 días | Pruebas de restore trimestrales |
| Encryption | TDE (Transparent Data Encryption) + OCI Vault | AES-256, keys en HSM |

### Principios de Modelado

```
□ Esquema alineado con módulos OCPI 2.2.1 (Locations, EVSEs, Tariffs, Sessions, CDRs)
□ Particionamiento por CPO y por fecha para tablas de alto volumen
□ Vistas materializadas para consultas de dashboard y API Open Data
□ Retención: raw 90 días en ATP, histórico en Object Storage (Data Lake)
□ PII identificado y clasificado (Ley 1581/2012) — Data Catalog OCI
□ Data Guard cross-region configurado para RPO < 1h, RTO < 30min
□ Backups automáticos con retención 60 días, pruebas de restore trimestrales
□ Connection pooling optimizado para Go (pgx) y Python (asyncpg/sqlalchemy)
□ Métricas de performance en OCI Monitoring: query latency, connections, IOPS
□ Audit trail de acceso a datos para cumplimiento SIC
```

### Estrategia de Particionamiento

| Tabla | Partición | Sub-partición | Retención |
|-------|-----------|---------------|-----------|
| `ocpi_locations` | Por CPO (LIST) | — | Indefinida |
| `ocpi_sessions` | Por fecha (RANGE, mensual) | Por CPO (LIST) | 90 días caliente |
| `ocpi_cdrs` | Por fecha (RANGE, mensual) | Por CPO (LIST) | 90 días caliente |
| `ocpi_tariffs` | Por CPO (LIST) | — | Indefinida |
| `audit_log` | Por fecha (RANGE, diario) | — | 2 años (WORM) |

---

## TimescaleDB — Time-Series

### Uso Principal
Telemetría de estaciones de carga: estado de conectores cada 60 segundos.

| Parámetro | Valor |
|-----------|-------|
| Hypertable | `connector_telemetry` |
| Chunk interval | 1 día |
| Compression | Habilitada (después de 7 días) |
| Retention | 90 días (drop_chunks automático) |
| Continuous Aggregates | Por hora, por día, por CPO |

### Schema Ejemplo

```sql
CREATE TABLE connector_telemetry (
    time        TIMESTAMPTZ NOT NULL,
    cpo_id      TEXT NOT NULL,
    location_id TEXT NOT NULL,
    evse_id     TEXT NOT NULL,
    connector_id TEXT NOT NULL,
    status      TEXT NOT NULL,  -- Available, Charging, OutOfOrder, etc.
    power_kw    DOUBLE PRECISION,
    energy_kwh  DOUBLE PRECISION,
    temperature DOUBLE PRECISION
);

SELECT create_hypertable('connector_telemetry', 'time');

-- Continuous aggregate: estado por hora
CREATE MATERIALIZED VIEW connector_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    cpo_id,
    location_id,
    status,
    COUNT(*) as readings,
    AVG(power_kw) as avg_power
FROM connector_telemetry
GROUP BY bucket, cpo_id, location_id, status;
```

---

## Data Lake — Medallion Architecture (OCI Object Storage)

### Capas

| Capa | Contenido | Formato | Retención | Mutabilidad |
|------|-----------|---------|-----------|-------------|
| **Bronze (Raw)** | JSON crudo de CPOs, logs de auditoría, eventos Kafka raw, backups Cárgame | JSON, Avro | 2 años | Inmutable (WORM) |
| **Silver (Curated)** | Datos validados OCPI, enriquecidos (geo), PII clasificado, anomalías detectadas, linaje trazable | Parquet | 5 años | Append-only |
| **Gold (Governance)** | KPIs nacionales, reportes MinEnergía/SIC, API Open Data, dashboards ejecutivos, datasets ML | Parquet, CSV, JSON | Indefinido | Versionado |

### Servicios OCI del Data Lake

| Servicio | Función |
|----------|---------|
| **OCI Object Storage** | Almacenamiento por capas (Standard/Infrequent/Archive), lifecycle policies, WORM |
| **OCI Data Flow** (Apache Spark) | ETL batch: Bronze→Silver→Gold, transformaciones, aggregations |
| **OCI Data Catalog** | Metadatos, clasificación PII (Ley 1581), linaje end-to-end, business glossary |
| **OCI Data Integration** | Pipelines de ingesta, CDC, scheduling |
| **OCI GoldenGate** | Replicación en tiempo real desde ATP al Data Lake (CDC) |

### Flujo de Datos

```
CPO → Ingesta → Kafka → ┬─► ATP (operacional, 90 días)
                         │
                         ├─► Object Storage Bronze (raw, WORM, 2 años)
                         │
                         └─► Data Flow (Spark) ─► Silver (validado, 5 años)
                                                      │
                                                      └─► Gold (KPIs, reportes, indefinido)
```

### Principios del Data Lake

```
□ Medallion Architecture (Bronze → Silver → Gold) implementada
□ Todo dato tiene linaje trazable end-to-end (Data Catalog)
□ PII clasificado y protegido (Ley 1581/2012)
□ Datos inmutables en Bronze (WORM policy) — cadena de custodia para SIC
□ Quality checks en cada capa (Great Expectations / dbt tests)
□ Datos Gold listos para consumo por API Open Data y dashboards
□ Retención: Bronze 2 años, Silver 5 años, Gold indefinido
□ Formatos: Parquet para analytics, JSON para APIs, CSV para reportes regulatorios
□ Catálogo de datos publicado con business glossary para stakeholders no técnicos
□ Anomaly detection: precios inconsistentes, disponibilidad falsa, reportes duplicados
```

---

## Redis (OCI Cache) — Estrategia de Caching

### Principio Base
Toda implementación de caché parte de una **línea base medida** — nunca se cachea por intuición, se cachea por datos.

### Estrategias por Caso de Uso

| Caso de Uso | Patrón | TTL | Invalidación |
|-------------|--------|-----|--------------|
| Validación CPO (Cárgame) | Cache-Aside | 24h | Event-driven (webhook Cárgame) + TTL |
| Estado de estaciones (OCPI) | Write-Through | 60s | Cada reporte del CPO sobreescribe |
| Tokens JWT (validación) | Cache-Aside | Hasta expiración del token | Revocación event-driven |
| Rate limiting counters | Sliding Window | 60s | Auto-expiry |
| Session data (portal) | Cache-Aside | 30min | Logout/expiry |
| Datos de consulta pública | Cache-Aside | 30s | Invalidación por nuevo reporte |
| Geolocalización estaciones | Read-Through | 1h | Cambio de ubicación (raro) |

### Namespacing

```
upme:{env}:{domain}:{key}

Ejemplos:
  upme:prod:cpo:12345:status          → Estado del CPO
  upme:prod:cpo:12345:cargame_valid   → Validación Cárgame cacheada
  upme:prod:location:LOC001:state     → Estado de estación
  upme:prod:ratelimit:cpo:12345       → Counter de rate limiting
  upme:prod:session:abc123            → Session data del portal
  upme:prod:public:stations:region:BOG → Estaciones por región (público)
```

### Principios de Redis

```
□ NUNCA cachear sin medir primero (latencia P50/P95/P99 sin caché vs con caché)
□ TTL definido para CADA key — no hay keys eternos
□ Estrategia de invalidación explícita documentada
□ Circuit breaker si Redis no disponible — fallback a base de datos
□ Redis Cluster para HA (mínimo 3 nodos en producción)
□ Cifrado en tránsito (TLS) y en reposo (encryption at rest)
□ Monitoreo: hit rate, miss rate, memory usage, eviction rate, latency
□ Serialización: MessagePack o Protocol Buffers (NO JSON para alto volumen)
□ Eviction policy: allkeys-lfu para caché general, noeviction para rate limiting
□ Documentar CADA caché: qué se cachea, por qué, TTL, invalidación, fallback
```

### Métricas de Redis a Monitorear

| Métrica | Umbral alerta | Acción |
|---------|--------------|--------|
| Hit rate | < 90% | Investigar patrones de acceso, ajustar TTL |
| Memory usage | > 80% max | Escalar cluster, revisar eviction policy |
| Eviction rate | > 0 (para rate limiting) | noeviction policy verificar |
| Connected clients | > 80% max connections | Connection pooling, review |
| Latency P99 | > 5ms | Investigar hot keys, cluster rebalance |
| Keyspace size | > 1M keys | Revisar TTLs, cleanup policy |

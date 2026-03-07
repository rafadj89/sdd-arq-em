# Comparativa: PostgreSQL vs Oracle Database 23ai

## Plataforma de Interoperabilidad UPME — Electromovilidad

> **Fecha:** Marzo 2026 | **Versión:** 1.0  
> **Perfil:** ~10 usuarios internos, ~10-50 CPOs integradores  
> **Arquitectura:** Monolito sincrónico (FastAPI + Python) sobre OCI  
> **Regulación:** Resolución 40559/2025 — MinEnergía | OCPI 2.2.1  
> **Requisitos clave:** OCPI JSON ingesta, audit inmutable SIC, soberanía datos Colombia (Ley 1581), VPN Cárgame

---

## Tabla de Contenido

1. [Contexto de la Decisión](#1-contexto-de-la-decisión)
2. [PostgreSQL — Panorama General](#2-postgresql--panorama-general)
3. [Oracle 23ai — Panorama General](#3-oracle-23ai--panorama-general)
4. [Comparativa Feature-by-Feature](#4-comparativa-feature-by-feature)
5. [Opciones de Despliegue y Costos — PostgreSQL](#5-opciones-de-despliegue-y-costos--postgresql)
6. [Opciones de Despliegue y Costos — Oracle 23ai](#6-opciones-de-despliegue-y-costos--oracle-23ai)
7. [Comparativa de Costos Consolidada](#7-comparativa-de-costos-consolidada)
8. [Mapeo a Requisitos UPME](#8-mapeo-a-requisitos-upme)
9. [Ecosistema y Compatibilidad con FastAPI](#9-ecosistema-y-compatibilidad-con-fastapi)
10. [Riesgos y Mitigaciones](#10-riesgos-y-mitigaciones)
11. [TCO (Total Cost of Ownership) a 3 Años](#11-tco-total-cost-of-ownership-a-3-años)
12. [Matriz de Decisión Ponderada](#12-matriz-de-decisión-ponderada)
13. [Veredicto y Recomendación](#13-veredicto-y-recomendación)

---

## 1. Contexto de la Decisión

### 1.1 ¿Por qué comparar?

La elección de base de datos es la decisión de infraestructura más importante del proyecto porque:

- **Representa ~50-70% del costo cloud** en la arquitectura UPME.
- **Define el stack de desarrollo:** ORM, driver, migraciones, queries.
- **Impacta compliance:** audit trail inmutable para SIC, soberanía de datos (Ley 1581).
- **Condiciona el hosting:** PostgreSQL abre opciones multi-cloud; Oracle 23ai tiene ventajas nativas en OCI.
- **Afecta contratación:** Oracle requiere licenciamiento; PostgreSQL es open-source.

### 1.2 Requisitos funcionales que la DB debe cumplir

| # | Requisito | Prioridad | Detalle |
|---|-----------|-----------|---------|
| R1 | **OCPI JSON ingesta** | Alta | Recibir y almacenar datos JSON OCPI 2.2.1 (locations, sessions, CDRs, tariffs) |
| R2 | **Reportes SQL** | Alta | Consultas relacionales para dashboards, KPIs, reportes regulatorios |
| R3 | **Audit trail inmutable** | Alta | Registros de auditoría para SIC — no modificables, no borrables, 7 años retención |
| R4 | **Soberanía de datos** | Alta | Datos en territorio colombiano (Ley 1581/2012) |
| R5 | **Búsqueda geoespacial** | Media | Buscar estaciones por ubicación (radio, bbox) |
| R6 | **Backups automáticos** | Alta | RPO ≤ 1 hora, sin intervención DBA |
| R7 | **Alta disponibilidad** | Media | Failover automático, RTO < 4 horas (aceptable para 10 usuarios) |
| R8 | **Compatibilidad FastAPI** | Alta | Driver Python async, ORM (SQLAlchemy), migraciones (Alembic) |
| R9 | **Búsqueda vectorial / AI** | Baja | Futuro: búsqueda semántica de estaciones, NL queries |
| R10 | **Costo mínimo** | Alta | Presupuesto gobierno limitado |

---

## 2. PostgreSQL — Panorama General

### 2.1 ¿Qué es PostgreSQL?

- **Tipo:** Base de datos relacional open-source (licencia PostgreSQL/MIT).
- **Versión actual:** PostgreSQL 17 (Oct 2025) / PostgreSQL 16 (LTS estable).
- **Costo de licencia:** **$0** — 100% gratuito, sin restricciones de uso comercial o gobierno.
- **Ecosistema:** El más amplio en open-source — miles de extensiones, soporte universal en todos los clouds.
- **Comunidad:** +40 años de desarrollo, comunidad global masiva, amplio talento disponible.

### 2.2 Features relevantes para UPME

| Feature | PostgreSQL 16/17 | Detalle |
|---------|-----------------|---------|
| **JSON nativo (JSONB)** | ✅ Maduro desde v9.4 | Almacenamiento binario JSON, indexación GIN, operadores JSON path, funciones JSON |
| **Full-text search** | ✅ Nativo | tsvector/tsquery, diccionarios español, ranking |
| **Geoespacial (PostGIS)** | ✅ Extensión madura | PostGIS: estándar de facto para GIS. Índices GIST, funciones ST_* |
| **Partitioning** | ✅ Nativo | Declarativo desde v10, por rango/lista/hash |
| **Logical Replication** | ✅ Nativo | Replicación lógica para read replicas |
| **Row-Level Security** | ✅ Nativo | Policies de acceso por fila — multi-tenant |
| **Vector Search (pgvector)** | ✅ Extensión | pgvector: embeddings, HNSW/IVFFlat indexes, búsqueda por similitud |
| **Graph queries** | ⚠️ Extensión (Apache AGE) | No nativo, requiere extensión Apache AGE |
| **Immutable audit trail** | ⚠️ Requiere diseño manual | Triggers + revoke DELETE/UPDATE, o extensiones (pgaudit, temporal tables) |
| **JSON Schema validation** | ⚠️ Extensión (pg_jsonschema) | No nativo, requiere extensión |
| **Natural language queries** | ❌ No nativo | Requiere integración externa con LLM |
| **Auto-tuning** | ❌ No nativo | Herramientas externas: pgTune, pghero, pg_stat_statements |
| **Auto-patching** | ❌ Depende del servicio managed | Solo en servicios managed (RDS, Cloud SQL, etc.) |

### 2.3 Versión recomendada para UPME

**PostgreSQL 16** (LTS) — versión estable con soporte hasta Nov 2028.

Extensiones necesarias:
```
- PostGIS 3.4+        → Geoespacial (búsqueda estaciones)
- pgvector 0.7+       → Vector search (futuro: búsqueda semántica)
- pgaudit 1.7+        → Audit logging detallado
- pg_jsonschema       → Validación JSON OCPI (opcional)
- pgcrypto            → Hashing, cifrado a nivel de columna
```

---

## 3. Oracle 23ai — Panorama General

### 3.1 ¿Qué es Oracle Database 23ai?

- **Tipo:** Base de datos relacional propietaria (licenciada).
- **Versión:** Oracle Database 23ai (LTS + AI features).
- **Costo de licencia:** Incluido en OCI (PAYG o UCM). BYOL si hay licencias existentes. **No es gratis fuera de OCI.**
- **Ecosistema:** Dominante en enterprise, gobierno, finanzas. Menor comunidad open-source.
- **Managed en OCI:** Autonomous Database (100% managed, 0 DBA).

### 3.2 Features relevantes para UPME

| Feature | Oracle 23ai | Detalle |
|---------|------------|---------|
| **JSON Relational Duality** | ✅ Exclusivo 23ai | JSON ↔ SQL bidireccional sin ORM. Zero mapping. |
| **JSONB equivalent** | ✅ JSON nativo | Tipo JSON binario, JSON path, indexación |
| **Full-text search** | ✅ Oracle Text | Maduro, multi-idioma, thesaurus |
| **Geoespacial** | ✅ Oracle Spatial | Nativo, licencia incluida en EE |
| **Partitioning** | ✅ Nativo | Composite, interval, reference partitioning |
| **Data Guard (HA)** | ✅ Incluido en Autonomous | Failover automático < 30 seg |
| **Vector Search** | ✅ AI Vector Search nativo | VECTOR datatype, HNSW, búsqueda semántica |
| **Graph queries** | ✅ Property Graph (SQL/PGQ) | Nativo en 23ai, estándar SQL/PGQ |
| **Blockchain/Immutable Tables** | ✅ Nativo | Hash chain SHA-512, retención forzada, inmutabilidad DB-level |
| **JSON Schema validation** | ✅ Nativo | CHECK constraint con IS JSON VALIDATE |
| **Select AI (NL queries)** | ✅ Nativo 23ai | Lenguaje natural → SQL via LLM integrado |
| **Auto-tuning** | ✅ Autonomous | Auto-indexing, SQL plan management |
| **Auto-patching** | ✅ Autonomous | Zero-downtime patching automático |
| **SQL Domains** | ✅ Nativo 23ai | Validación de tipos a nivel de dominio |
| **True Cache** | ✅ Nativo 23ai | Cache read-only automático |
| **DBMS_CLOUD** | ✅ Nativo | Acceso directo a Object Storage desde SQL |

---

## 4. Comparativa Feature-by-Feature

### 4.1 Tabla Maestra de Comparación

| Categoría | Feature | PostgreSQL 16/17 | Oracle 23ai | Ventaja |
|-----------|---------|-----------------|------------|---------|
| **JSON** | Almacenamiento JSON | ✅ JSONB (maduro) | ✅ JSON binary | Empate |
| | Indexación JSON | ✅ GIN indexes | ✅ JSON search index | Empate |
| | JSON path queries | ✅ jsonpath | ✅ JSON_VALUE, dot notation | Empate |
| | JSON ↔ Relacional | ⚠️ Manual (ORM/queries) | ✅ **JSON Duality Views** | **Oracle** |
| | JSON Schema validation | ⚠️ Extensión (pg_jsonschema) | ✅ Nativo (IS JSON VALIDATE) | **Oracle** |
| **Geoespacial** | Queries geoespaciales | ✅ **PostGIS** (estándar de facto) | ✅ Oracle Spatial | **PostgreSQL** (PostGIS es superior) |
| | Índices espaciales | ✅ GIST, SP-GIST | ✅ R-tree, Quadtree | Empate |
| **Audit** | Audit logging | ✅ pgaudit (extensión) | ✅ Unified Auditing | Empate |
| | **Inmutabilidad garantizada** | ⚠️ Triggers + REVOKE (diseño manual) | ✅ **Blockchain Tables** (nativo) | **Oracle** |
| | Hash chain verification | ❌ No nativo | ✅ SHA-512 hash chain | **Oracle** |
| | Retención forzada | ⚠️ Manual (policies) | ✅ NO DELETE UNTIL N DAYS | **Oracle** |
| **AI / ML** | Vector embeddings | ✅ pgvector (extensión madura) | ✅ AI Vector Search (nativo) | Empate |
| | Similarity search | ✅ HNSW, IVFFlat | ✅ HNSW, IVFFlat | Empate |
| | Natural language → SQL | ❌ No nativo | ✅ **Select AI** | **Oracle** |
| | In-DB ML | ⚠️ pgml (extensión, experimental) | ✅ OML (Oracle Machine Learning) | **Oracle** |
| **Performance** | Auto-tuning | ❌ Manual (pgTune, pghero) | ✅ Auto-indexing, SQL Plan Mgmt | **Oracle** |
| | Connection pooling | ⚠️ Externo (PgBouncer) | ✅ Nativo (DRCP) | **Oracle** |
| | Read cache | ⚠️ shared_buffers (manual) | ✅ **True Cache** (automático) | **Oracle** |
| | Partitioning | ✅ Declarativo | ✅ + Interval, Reference | **Oracle** (más opciones) |
| **HA / DR** | Replicación | ✅ Streaming + Logical | ✅ **Data Guard** (incluido Autonomous) | **Oracle** (Autonomous) |
| | Failover automático | ⚠️ Patroni/PgBouncer (config manual) | ✅ Automático (<30s en Autonomous) | **Oracle** |
| | Backups | ⚠️ pg_basebackup / pgBackRest (config) | ✅ Automáticos 60 días (Autonomous) | **Oracle** (Autonomous) |
| **Seguridad** | Row-Level Security | ✅ Nativo (policies) | ✅ VPD (Virtual Private Database) | Empate |
| | TDE (Transparent Data Encryption) | ⚠️ No nativo (pgcrypto parcial) | ✅ Nativo (TDE automático) | **Oracle** |
| | Cifrado at rest | ⚠️ Depende del servicio managed | ✅ Automático siempre | **Oracle** |
| | Schema-level privileges | ⚠️ Limitado (grant por objeto) | ✅ Nativo 23ai | **Oracle** |
| **Operaciones** | Auto-patching | ⚠️ Solo en servicios managed | ✅ Automático (Autonomous) | **Oracle** |
| | Necesidad de DBA | ⚠️ Parcial (tuning, vacuuming, replication) | ✅ **Cero** con Autonomous | **Oracle** |
| | Vacuuming / bloat | ⚠️ Requiere VACUUM regular | ✅ No aplica (MVCC Oracle diferente) | **Oracle** |
| **Ecosistema** | ORM (SQLAlchemy) | ✅ Soporte nativo, maduro | ✅ Soporte via oracledb driver | **PostgreSQL** (más maduro) |
| | Driver async Python | ✅ asyncpg (ultra-rápido) | ✅ python-oracledb (async) | **PostgreSQL** (asyncpg más rápido) |
| | Alembic (migraciones) | ✅ Soporte nativo perfecto | ✅ Soportado (algunos workarounds) | **PostgreSQL** |
| | Comunidad/talento | ✅ **Masiva** — fácil contratar | ⚠️ Menor — especialistas Oracle | **PostgreSQL** |
| | Portabilidad | ✅ **Multi-cloud**, on-premise, local | ⚠️ Mejor en OCI, limitado fuera | **PostgreSQL** |
| **Licencia** | Costo de software | ✅ **$0** (open-source) | ⚠️ Incluido en OCI, costoso fuera | **PostgreSQL** |
| | Vendor lock-in | ✅ **Ninguno** | ⚠️ Lock-in a Oracle/OCI | **PostgreSQL** |

### 4.2 Scorecard Resumen

| Categoría | PostgreSQL | Oracle 23ai |
|-----------|-----------|------------|
| JSON handling | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ (Duality Views) |
| Geoespacial | ⭐⭐⭐⭐⭐ (PostGIS) | ⭐⭐⭐⭐ |
| Audit inmutable | ⭐⭐⭐ (manual) | ⭐⭐⭐⭐⭐ (Blockchain Tables) |
| AI / Vector | ⭐⭐⭐⭐ (pgvector) | ⭐⭐⭐⭐⭐ (nativo + Select AI) |
| Performance auto | ⭐⭐⭐ (manual) | ⭐⭐⭐⭐⭐ (auto-tune) |
| HA / DR | ⭐⭐⭐ (config manual) | ⭐⭐⭐⭐⭐ (Autonomous) |
| Seguridad | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Ecosistema Python | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Portabilidad | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Costo de licencia | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Vendor lock-in | ⭐⭐⭐⭐⭐ (ninguno) | ⭐⭐ (alto) |

---

## 5. Opciones de Despliegue y Costos — PostgreSQL

### 5.1 Opción PG-A: OCI PostgreSQL Database Service (Managed)

> OCI ofrece un servicio managed de PostgreSQL desde 2023.

| Concepto | Configuración | Precio | Costo/mes |
|----------|--------------|--------|-----------|
| **Prod: OCI PostgreSQL** | 1 OCPU, 8 GB RAM (E4 shape) | $0.0726/OCPU/hr | **$52.99** |
| **Prod: Storage** | 200 GB (Performance tier) | $0.065/GB/mes | **$13.00** |
| **Prod: Backup** | Automático (managed) | Incluido | **$0.00** |
| **Dev/QA: OCI PostgreSQL** | 1 OCPU, 4 GB | $0.0726/OCPU/hr | **$52.99** |
| **Dev/QA: Storage** | 50 GB | $0.065/GB/mes | **$3.25** |
| **Sandbox: OCI PostgreSQL** | 1 OCPU, 4 GB | $0.0726/OCPU/hr | **$52.99** |
| **Sandbox: Storage** | 50 GB | $0.065/GB/mes | **$3.25** |
| **HA (opcional)** | Read replica Prod | +$52.99 | **+$52.99** |
| **Subtotal DB (sin HA)** | 3 ambientes | | **$178.47** |
| **Subtotal DB (con HA)** | 3 ambientes + replica | | **$231.46** |

> ⚠️ **No hay Always Free para OCI PostgreSQL.** Los 3 ambientes se pagan completos. Esto contrasta con Oracle Autonomous donde Dev/QA y Sandbox pueden ser Always Free ($0).

**Extensiones soportadas en OCI PostgreSQL:**

| Extensión | ¿Disponible? | Notas |
|-----------|-------------|-------|
| PostGIS | ✅ Sí | Geoespacial |
| pgvector | ✅ Sí | Vector search |
| pgaudit | ✅ Sí | Audit logging |
| pgcrypto | ✅ Sí | Cifrado |
| pg_jsonschema | ⚠️ No estándar | Puede no estar disponible |
| Apache AGE (graph) | ❌ No | No soportado en OCI managed |

---

### 5.2 Opción PG-B: PostgreSQL en OCI Compute VM (Self-managed)

> Instalar PostgreSQL manualmente en una VM de OCI. Máximo control, mínimo costo, máxima responsabilidad.

| Concepto | Configuración | Precio | Costo/mes |
|----------|--------------|--------|-----------|
| **Prod: VM E4 Flex** | 1 OCPU, 8 GB RAM | $0.025/OCPU/hr | **$18.25** |
| **Prod: Block Storage** | 200 GB | $0.0255/GB/mes | **$5.10** |
| **Prod: Backup (Block Vol Backup)** | 200 GB snapshots | $0.005/GB/mes | **$1.00** |
| **Dev/QA: VM A1 ARM** | 1 OCPU, 8 GB (Always Free) | Always Free | **$0.00** |
| **Dev/QA: Block Storage** | 50 GB (Always Free) | Always Free | **$0.00** |
| **Sandbox: VM E4 Flex** | 1 OCPU, 4 GB | $0.025/OCPU/hr | **$18.25** |
| **Sandbox: Block Storage** | 50 GB | $0.0255/GB/mes | **$1.28** |
| **HA (opcional)** | Streaming replication manual | +$18.25 (2da VM) | **+$18.25** |
| **PgBouncer** | Connection pooling | En misma VM | **$0.00** |
| **pgBackRest** | Backup to Object Storage | Config manual | **$0.50** |
| **Subtotal DB (sin HA)** | 3 ambientes | | **$44.38** |
| **Subtotal DB (con HA)** | + read replica | | **$62.63** |

> ✅ **Dev/QA en Always Free:** Se puede instalar PostgreSQL 16 en la VM ARM A1 (Always Free) — incluyendo PostGIS, pgvector, pgaudit. Esto sí es gratuito, a diferencia de OCI PostgreSQL managed.

> ⚠️ **Responsabilidad total del equipo:** Patching, vacuuming, tuning, backups, HA, monitoring, security hardening — todo manual.

---

### 5.3 Opción PG-C: PostgreSQL Managed Multi-Cloud

> Alternativas managed fuera de OCI (requiere evaluar soberanía de datos).

| Servicio | Config mínima | Costo/mes (estimado) | Región Colombia | Managed | Free tier |
|----------|--------------|---------------------|-----------------|---------|-----------|
| **AWS RDS PostgreSQL** | db.t3.micro, 20 GB | ~$25-50 | ❌ No (São Paulo) | ✅ Sí | ⚠️ 12 meses |
| **Google Cloud SQL** | db-f1-micro, 10 GB | ~$15-30 | ❌ No (São Paulo) | ✅ Sí | ❌ No |
| **Azure Database for PG** | Burstable B1ms, 32 GB | ~$30-50 | ❌ No (São Paulo) | ✅ Sí | ⚠️ 12 meses |
| **Supabase** | Free → Pro ($25/mes) | $0-25 | ❌ No (US/EU) | ✅ Sí | ✅ Free tier |
| **Neon** | Free → Launch ($19/mes) | $0-19 | ❌ No (US/EU) | ✅ Serverless | ✅ Free tier |
| **Railway** | Starter ($5/mes) | $5-20 | ❌ No (US/EU) | ✅ Sí | ✅ $5/mes credit |
| **Crunchy Bridge** | Hobby ($25/mes) | $25-100 | ❌ No | ✅ Sí | ❌ No |

> ❌ **Descartados para Producción UPME:** Ninguno tiene **región en Colombia**. La Ley 1581/2012 y la Resolución 40559/2025 requieren soberanía de datos. Solo OCI tiene región Bogotá.

> ✅ **Válidos para desarrollo local:** Supabase Free o Neon Free pueden servir como DB de desarrollo personal sin costo.

---

### 5.4 Resumen de Costos PostgreSQL (3 ambientes en OCI)

| Opción | DB Prod/mes | DB Total 3 amb/mes | HA incluida | DBA requerido | Always Free Dev |
|--------|------------|--------------------|-----------|----|-----------------|
| **PG-A: OCI PG Managed** | $65.99 | **$178.47** | ⚠️ +$53 | Parcial | ❌ No |
| **PG-A: OCI PG + HA** | $65.99 | **$231.46** | ✅ Replica | Parcial | ❌ No |
| **PG-B: VM Self-managed** | $24.35 | **$44.38** | ❌ No | ✅ Completo | ✅ ARM Free |
| **PG-B: VM + HA** | $24.35 | **$62.63** | ⚠️ Manual | ✅ Completo | ✅ ARM Free |

---

## 6. Opciones de Despliegue y Costos — Oracle 23ai

> Resumen de `estimacion-oracle-23ai-upme.md` (documento detallado aparte).

| Opción | DB Prod/mes | DB Total 3 amb/mes | HA incluida | DBA requerido | Always Free Dev |
|--------|------------|--------------------|-----------|----|-----------------|
| **ORA-A: Autonomous PAYG** | $393.86 | **$393.86** | ✅ Data Guard | ❌ No | ✅ 2 instancias |
| **ORA-B: Autonomous BYOL** | $116.97 | **$116.97** | ✅ Data Guard | ❌ No | ✅ 2 instancias |
| **ORA-C: Base DB VM EE PAYG** | $106.49 | **$268.47** | ❌ (+$74) | ✅ Parcial | ❌ No |
| **ORA-D: Base DB VM EE BYOL** | $50.72 | **$101.16** | ❌ (+$19) | ✅ Parcial | ❌ No |

---

## 7. Comparativa de Costos Consolidada

### 7.1 Solo Database (3 ambientes: Prod + Dev/QA + Sandbox)

| # | Opción | DB/mes | HA | DBA | Free Dev |
|---|--------|--------|----|----|----------|
| 1 | **PG VM Self-managed** | **$44** | ❌ | ✅ Full | ✅ (ARM) |
| 2 | **PG VM + HA** | **$63** | ⚠️ Manual | ✅ Full | ✅ (ARM) |
| 3 | **Oracle Base DB BYOL** | **$101** | ❌ | ✅ Parcial | ❌ |
| 4 | **Oracle Autonomous BYOL** | **$117** | ✅ Auto | ❌ | ✅ |
| 5 | **PG OCI Managed** | **$178** | ❌ | Parcial | ❌ |
| 6 | **PG OCI Managed + HA** | **$231** | ✅ Replica | Parcial | ❌ |
| 7 | **Oracle Base DB PAYG** | **$268** | ❌ | ✅ Parcial | ❌ |
| 8 | **Oracle Autonomous PAYG** | **$394** | ✅ Auto | ❌ | ✅ |

```
┌─────────────────────────────────────────────────────────────────────────┐
│      COSTO MENSUAL DATABASE — 3 AMBIENTES (Prod + Dev/QA + Sandbox)    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PG VM Self-managed         ██░░░░░░░░░░░░░░░░░░░░░░░░  $44    ★ más  │
│  PG VM + HA                 ███░░░░░░░░░░░░░░░░░░░░░░░░  $63    barato│
│  Oracle Base DB BYOL        █████░░░░░░░░░░░░░░░░░░░░░░  $101         │
│  Oracle Autonomous BYOL     ██████░░░░░░░░░░░░░░░░░░░░░  $117   ★     │
│  PG OCI Managed             █████████░░░░░░░░░░░░░░░░░░  $178         │
│  PG OCI Managed + HA        ████████████░░░░░░░░░░░░░░░  $231         │
│  Oracle Base DB PAYG        ██████████████░░░░░░░░░░░░░  $268         │
│  Oracle Autonomous PAYG     ████████████████████░░░░░░░  $394         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Costo Total (DB + Infraestructura Complementaria)

La infraestructura complementaria (compute, networking, WAF, VPN, storage, DevOps) es **$150.94/mes** independientemente de la DB elegida.

| # | Opción | DB/mes | Infra/mes | **Total/mes** | **Total/año** |
|---|--------|--------|-----------|---------------|---------------|
| 1 | **PG VM Self-managed** | $44 | $151 | **$195** | **$2,340** |
| 2 | **PG VM + HA** | $63 | $151 | **$214** | **$2,568** |
| 3 | **Oracle Base DB BYOL** | $101 | $151 | **$252** | **$3,025** |
| 4 | **Oracle Autonomous BYOL** | $117 | $151 | **$268** | **$3,215** |
| 5 | **PG OCI Managed** | $178 | $151 | **$329** | **$3,952** |
| 6 | **Oracle Autonomous PAYG** | $394 | $151 | **$545** | **$6,538** |

### 7.3 Con UCM Annual Flex (33% descuento)

| # | Opción | PAYG/mes | UCM/mes | UCM/año |
|---|--------|---------|--------|---------|
| 1 | PG VM Self-managed | $195 | **$131** | **$1,568** |
| 2 | Oracle Autonomous BYOL | $268 | **$180** | **$2,154** |
| 3 | PG OCI Managed | $329 | **$220** | **$2,644** |
| 4 | Oracle Autonomous PAYG | $545 | **$365** | **$4,380** |

---

## 8. Mapeo a Requisitos UPME

### 8.1 Evaluación por Requisito

| Requisito | PostgreSQL | Oracle 23ai | Notas |
|-----------|-----------|------------|-------|
| **R1: OCPI JSON ingesta** | ✅ JSONB maduro, operadores ricos | ✅ JSON Duality Views (superior) | Oracle: menos código ORM |
| **R2: Reportes SQL** | ✅ SQL estándar completo | ✅ SQL + analytics functions | Empate |
| **R3: Audit inmutable SIC** | ⚠️ **Diseño manual** (triggers, revoke, pgaudit) — no hay garantía criptográfica de inmutabilidad | ✅ **Blockchain Tables** — inmutabilidad con hash chain SHA-512 verificable | **Oracle gana claramente** |
| **R4: Soberanía datos Colombia** | ✅ OCI Bogotá (VM o PG managed) | ✅ OCI Bogotá (Autonomous/Base DB) | Empate (ambos en OCI) |
| **R5: Búsqueda geoespacial** | ✅ **PostGIS** (estándar de facto, superior) | ✅ Oracle Spatial (bueno) | **PostgreSQL gana** |
| **R6: Backups automáticos** | ⚠️ Config manual (VM) o managed | ✅ Automáticos 60 días (Autonomous) | **Oracle gana** (Autonomous) |
| **R7: Alta disponibilidad** | ⚠️ Patroni + manual (VM) o managed replica | ✅ Data Guard automático <30s (Autonomous) | **Oracle gana** (Autonomous) |
| **R8: Compatibilidad FastAPI** | ✅ **asyncpg** + SQLAlchemy + Alembic (perfecto) | ✅ python-oracledb async + SQLAlchemy (bueno, algunos workarounds) | **PostgreSQL gana** |
| **R9: AI / Vector Search** | ✅ pgvector (maduro) | ✅ AI Vector Search + Select AI | **Oracle gana** (Select AI) |
| **R10: Costo mínimo** | ✅ **$44-178/mes** (3 ambientes) | ⚠️ **$117-394/mes** (3 ambientes) | **PostgreSQL gana** en costo puro |

### 8.2 Score por Requisito

| Requisito | Peso | PG Score (1-5) | Oracle Score (1-5) | PG Ponderado | Oracle Ponderado |
|-----------|------|---------------|-------------------|-------------|-----------------|
| R1: OCPI JSON | 15% | 4 | 5 | 0.60 | 0.75 |
| R2: Reportes SQL | 10% | 5 | 5 | 0.50 | 0.50 |
| R3: Audit SIC | 15% | 3 | 5 | 0.45 | **0.75** |
| R4: Soberanía datos | 10% | 5 | 5 | 0.50 | 0.50 |
| R5: Geoespacial | 5% | 5 | 4 | 0.25 | 0.20 |
| R6: Backups auto | 10% | 3 | 5 | 0.30 | **0.50** |
| R7: HA / DR | 10% | 3 | 5 | 0.30 | **0.50** |
| R8: FastAPI compat | 10% | 5 | 4 | **0.50** | 0.40 |
| R9: AI / Vector | 5% | 4 | 5 | 0.20 | 0.25 |
| R10: Costo | 10% | 5 | 3 | **0.50** | 0.30 |
| **TOTAL** | **100%** | | | **4.10** | **4.65** |

---

## 9. Ecosistema y Compatibilidad con FastAPI

### 9.1 Stack de Desarrollo — PostgreSQL

```python
# requirements.txt — Stack PostgreSQL
fastapi>=0.110.0
uvicorn>=0.27.0
sqlalchemy>=2.0.25          # ORM — soporte nativo perfecto PG
asyncpg>=0.29.0             # Driver async — ultra-rápido, maduro
alembic>=1.13.0             # Migraciones — soporte nativo PG
psycopg[binary]>=3.1.0      # Driver sync (para scripts, migraciones)
geoalchemy2>=0.14.0         # PostGIS integration con SQLAlchemy
pgvector>=0.2.4             # Vector search integration
pydantic>=2.5.0             # Validación OCPI
```

**Ventajas ecosistema PG:**
- **asyncpg** es el driver async más rápido para Python (benchmarks 2-3x vs otros).
- **SQLAlchemy + Alembic** tienen soporte PostgreSQL como ciudadano de primera clase.
- **Tutoriales FastAPI + PostgreSQL** son abundantes — es la combinación más documentada.
- **Contratar desarrolladores** con experiencia PG + FastAPI es fácil.
- **Testeo local** trivial: `docker run postgres:16` y listo.

### 9.2 Stack de Desarrollo — Oracle 23ai

```python
# requirements.txt — Stack Oracle 23ai
fastapi>=0.110.0
uvicorn>=0.27.0
sqlalchemy>=2.0.25          # ORM — soporta Oracle (dialect oracledb)
python-oracledb>=2.0.0      # Driver oficial Oracle (thin + thick mode)
alembic>=1.13.0             # Migraciones — soporta Oracle (algunos workarounds)
pydantic>=2.5.0             # Validación OCPI
```

**Ventajas ecosistema Oracle:**
- **python-oracledb 2.0+** soporta async/await nativo para FastAPI.
- **Thin mode** (sin Oracle Client) — ideal para containers.
- **JSON Duality Views** simplifican enormemente el data layer.
- **DBMS_CLOUD** integra Object Storage directamente desde SQL.

**Desventajas ecosistema Oracle:**
- **Alembic + Oracle** requiere workarounds para algunos DDL (sequences, triggers).
- **Testeo local** requiere Oracle Free container (~2 GB, más pesado que PostgreSQL).
- **Menos tutoriales** FastAPI + Oracle — la combinación es menos documentada.
- **Contratar desarrolladores** con experiencia Oracle + FastAPI es más difícil.

### 9.3 Comparativa de Desarrollo

| Aspecto | PostgreSQL | Oracle 23ai |
|---------|-----------|------------|
| `docker run` para dev local | `docker run postgres:16` (500 MB) | `docker run gvenzl/oracle-free:23-slim` (2+ GB) |
| Tiempo setup local | ~30 segundos | ~2-3 minutos |
| Driver async performance | ⭐⭐⭐⭐⭐ (asyncpg benchmark leader) | ⭐⭐⭐⭐ (python-oracledb, bueno) |
| SQLAlchemy dialect maturity | ⭐⭐⭐⭐⭐ (referencia) | ⭐⭐⭐⭐ (sólido, menos documentado) |
| Alembic migrations | ⭐⭐⭐⭐⭐ (sin workarounds) | ⭐⭐⭐⭐ (workarounds en AUTO_INCREMENT, sequences) |
| Tutoriales FastAPI + DB | ⭐⭐⭐⭐⭐ (miles) | ⭐⭐⭐ (limitados) |
| Pool de talento Colombia | ⭐⭐⭐⭐⭐ (abundante) | ⭐⭐⭐ (especialistas Oracle caros) |
| Testing frameworks | ⭐⭐⭐⭐⭐ (pytest + testcontainers) | ⭐⭐⭐⭐ (pytest + oracle-free container) |

---

## 10. Riesgos y Mitigaciones

### 10.1 Riesgos PostgreSQL

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| **Audit SIC: inmutabilidad no verificable criptográficamente** | Alta | Alto | Complementar con Object Storage WORM ($0.26/mes). Diseñar triggers + REVOKE + pgaudit. |
| **Falta DBA para operaciones** | Media | Alto | Usar OCI PostgreSQL Managed (+$134/mes vs VM). O capacitar equipo en PG operations. |
| **Vacuuming / table bloat** | Media | Medio | Configurar autovacuum agresivo. Monitorear con pg_stat_user_tables. |
| **HA manual compleja** | Media | Alto | Usar OCI PG Managed con read replica. O aceptar backup+restore manual (RPO 1h, RTO 2-4h). |
| **Extensiones no disponibles en managed** | Baja | Medio | Verificar lista de extensiones OCI PG antes de elegir. Si falta algo → VM self-managed. |

### 10.2 Riesgos Oracle 23ai

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| **Vendor lock-in** | Alta | Alto | Usar SQL estándar donde posible. Abstracción via SQLAlchemy. Evitar funciones Oracle-only en lógica de negocio. Pero: JSON Duality, Blockchain Tables son Oracle-only. |
| **Costo escalamiento futuro** | Media | Alto | UCM Annual Flex fija precio. BYOL si hay licencias. Monitorear con OCI Budgets. |
| **Menor pool de talento** | Media | Medio | python-oracledb se parece mucho a cualquier DB driver. La curva de aprendizaje para desarrolladores Python es baja. |
| **Alembic workarounds** | Baja | Bajo | Documentar workarounds. Usar raw SQL migrations donde necesario. |
| **Oracle Free container pesado para dev local** | Baja | Bajo | Usar Always Free Autonomous para dev (conexión remota) en lugar de container local. |
| **Dependencia de OCI Bogotá** | Baja | Alto | Oracle tiene compromiso a largo plazo con la región. Contingencia: Autonomous en São Paulo como DR. |

---

## 11. TCO (Total Cost of Ownership) a 3 Años

### 11.1 Costo Directo de Infraestructura (36 meses)

| Opción | Mes 1-6 (PAYG) | Mes 7-36 (UCM) | **TCO 3 años** |
|--------|----------------|----------------|----------------|
| **PG VM Self-managed** | $195 × 6 = $1,170 | $131 × 30 = $3,930 | **$5,100** |
| **PG OCI Managed** | $329 × 6 = $1,974 | $220 × 30 = $6,609 | **$8,583** |
| **Oracle Autonomous BYOL** | $268 × 6 = $1,608 | $180 × 30 = $5,394 | **$7,002** |
| **Oracle Autonomous PAYG** | $545 × 6 = $3,270 | $365 × 30 = $10,950 | **$14,220** |

### 11.2 Costo Oculto: Esfuerzo DBA / DevOps

| Actividad | PostgreSQL VM | PG Managed | Oracle Autonomous |
|-----------|--------------|-----------|-------------------|
| Patching OS + DB (mensual) | 4h/mes × $50/h = $200 | 0h (auto) | 0h (auto) |
| Backup verificación | 2h/mes × $50/h = $100 | 1h/mes = $50 | 0h (auto) |
| Tuning / vacuuming | 2h/mes × $50/h = $100 | 1h/mes = $50 | 0h (auto) |
| HA / failover testing | 2h/mes × $50/h = $100 | 1h/mes = $50 | 0h (auto) |
| Monitoring setup / maintenance | 2h/mes × $50/h = $100 | 1h/mes = $50 | 0h (auto) |
| **Total DBA/mes** | **$600/mes** | **$200/mes** | **$0/mes** |
| **Total DBA/3 años** | **$21,600** | **$7,200** | **$0** |

### 11.3 TCO Total (Infra + DBA) a 3 Años

| Opción | Infra 3 años | DBA 3 años | **TCO Total** |
|--------|-------------|-----------|---------------|
| **PG VM Self-managed** | $5,100 | $21,600 | **$26,700** |
| **PG OCI Managed** | $8,583 | $7,200 | **$15,783** |
| **Oracle Autonomous BYOL** | $7,002 | $0 | **$7,002** |
| **Oracle Autonomous PAYG** | $14,220 | $0 | **$14,220** |

```
┌─────────────────────────────────────────────────────────────────────────┐
│              TCO TOTAL A 3 AÑOS — INFRA + DBA (USD)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Oracle Autonomous BYOL    ████████░░░░░░░░░░░░░░░░░░░░  $7,002  ★    │
│  Oracle Autonomous PAYG    ████████████████░░░░░░░░░░░░░  $14,220      │
│  PG OCI Managed            ██████████████████░░░░░░░░░░░  $15,783      │
│  PG VM Self-managed        ██████████████████████████████  $26,700      │
│                                                                         │
│  ★ = Más económico considerando TCO completo                           │
│                                                                         │
│  NOTA: PG VM parece barato en infra ($5K) pero el costo DBA            │
│  ($21.6K) lo convierte en la opción MÁS CARA en TCO total.             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

> 🔑 **Insight crítico:** PostgreSQL VM es la opción más barata en **costo de infraestructura** ($5,100/3 años) pero la **más cara en TCO total** ($26,700/3 años) porque requiere ~12h/mes de trabajo DBA. Oracle Autonomous elimina 100% del esfuerzo DBA y tiene el **mejor TCO** con BYOL ($7,002/3 años).

---

## 12. Matriz de Decisión Ponderada

### 12.1 Criterios y Pesos

| # | Criterio | Peso | Justificación del peso |
|---|----------|------|------------------------|
| C1 | **Costo total (TCO 3 años)** | 20% | Presupuesto gobierno limitado |
| C2 | **Cumplimiento regulatorio (SIC, Ley 1581)** | 20% | Mandatorio — no negociable |
| C3 | **Esfuerzo operacional (DBA)** | 15% | Equipo pequeño, sin DBA dedicado |
| C4 | **Compatibilidad FastAPI / Python** | 15% | Stack de desarrollo definido |
| C5 | **Features técnicos (JSON, geo, AI)** | 10% | Funcionalidad de la plataforma |
| C6 | **HA / DR** | 10% | Continuidad del servicio |
| C7 | **Portabilidad / vendor lock-in** | 5% | Flexibilidad futura |
| C8 | **Pool de talento** | 5% | Facilidad de contratación |

### 12.2 Scoring (1-5 por criterio)

| Criterio | PG VM | PG Managed | Oracle Auto PAYG | Oracle Auto BYOL |
|----------|-------|-----------|-----------------|-----------------|
| C1: TCO | 2 | 3 | 3 | **5** |
| C2: Compliance SIC | 3 | 3 | **5** | **5** |
| C3: Esfuerzo DBA | 1 | 3 | **5** | **5** |
| C4: FastAPI compat | **5** | **5** | 4 | 4 |
| C5: Features | 4 | 4 | **5** | **5** |
| C6: HA / DR | 2 | 3 | **5** | **5** |
| C7: Portabilidad | **5** | **5** | 2 | 2 |
| C8: Talento | **5** | **5** | 3 | 3 |

### 12.3 Score Ponderado Final

| Criterio | Peso | PG VM | PG Managed | Oracle Auto PAYG | Oracle Auto BYOL |
|----------|------|-------|-----------|-----------------|-----------------|
| C1 (20%) | | 0.40 | 0.60 | 0.60 | **1.00** |
| C2 (20%) | | 0.60 | 0.60 | **1.00** | **1.00** |
| C3 (15%) | | 0.15 | 0.45 | **0.75** | **0.75** |
| C4 (15%) | | **0.75** | **0.75** | 0.60 | 0.60 |
| C5 (10%) | | 0.40 | 0.40 | **0.50** | **0.50** |
| C6 (10%) | | 0.20 | 0.30 | **0.50** | **0.50** |
| C7 (5%) | | **0.25** | **0.25** | 0.10 | 0.10 |
| C8 (5%) | | **0.25** | **0.25** | 0.15 | 0.15 |
| **TOTAL** | **100%** | **3.00** | **3.60** | **4.20** | **4.60** |

```
┌────────────────────────────────────────────────────────────────┐
│             SCORE FINAL PONDERADO (de 5.00)                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Oracle Autonomous BYOL    █████████████████████████  4.60 ★  │
│  Oracle Autonomous PAYG    ████████████████████████░  4.20     │
│  PG OCI Managed            ████████████████████░░░░░  3.60     │
│  PG VM Self-managed        ████████████████░░░░░░░░░  3.00     │
│                                                                │
│  ★ = Opción recomendada                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 13. Veredicto y Recomendación

### 13.1 Resumen de la Comparación

| Dimensión | PostgreSQL | Oracle 23ai | Ganador |
|-----------|-----------|------------|---------|
| **Costo de infraestructura** | ✅ Más barato ($44-178/mes DB) | ⚠️ Más caro ($117-394/mes DB) | **PostgreSQL** |
| **TCO con DBA** | ⚠️ DBA sube TCO significativamente | ✅ Cero DBA con Autonomous | **Oracle** |
| **Cumplimiento SIC** | ⚠️ Audit manual, sin garantía cripto | ✅ Blockchain Tables con hash chain | **Oracle** |
| **Features para OCPI** | ✅ JSONB sólido | ✅ JSON Duality Views superior | **Oracle** |
| **Geoespacial** | ✅ PostGIS (estándar de facto) | ✅ Spatial (bueno) | **PostgreSQL** |
| **HA / DR automático** | ⚠️ Manual o managed | ✅ Data Guard incluido | **Oracle** |
| **Ecosistema FastAPI** | ✅ asyncpg + SQLAlchemy perfecto | ✅ Bueno, menos documentado | **PostgreSQL** |
| **Portabilidad** | ✅ Multi-cloud, cero lock-in | ⚠️ Vendor lock-in OCI | **PostgreSQL** |
| **Talento disponible** | ✅ Abundante | ⚠️ Especialistas caros | **PostgreSQL** |
| **AI integrado** | ✅ pgvector (bueno) | ✅ Vector + Select AI (superior) | **Oracle** |

### 13.2 ¿Cuándo elegir PostgreSQL?

✅ **Elegir PostgreSQL si:**
- El presupuesto de infraestructura es la prioridad absoluta ($44/mes vs $117+).
- El equipo ya tiene experiencia PostgreSQL + FastAPI.
- Hay DBA disponible (interno o contratado) para operaciones.
- Se quiere evitar vendor lock-in a toda costa.
- El compliance SIC se puede resolver con Object Storage WORM + pgaudit.
- Se necesita PostGIS avanzado (análisis geoespaciales complejos).
- Existe posibilidad de migrar a otro cloud en el futuro.

### 13.3 ¿Cuándo elegir Oracle 23ai?

✅ **Elegir Oracle 23ai si:**
- No hay DBA disponible y se quiere cero esfuerzo operacional.
- El compliance SIC con audit inmutable verificable es prioritario.
- Se quieren features 23ai (JSON Duality, Blockchain Tables, Select AI).
- La UPME tiene licencias Oracle existentes (BYOL baja el costo a $117/mes).
- Se acepta el lock-in a OCI (la región Bogotá ya es un compromiso con OCI de todas formas).
- Se valora HA/DR automático sin configuración.

### 13.4 Recomendación para UPME

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                    RECOMENDACIÓN FINAL                                    │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  OPCIÓN PRINCIPAL (si hay BYOL o presupuesto > $300/mes):               │
│  ──────────────────────────────────────────────────────────              │
│  ★ Oracle Autonomous Database 23ai Serverless                            │
│                                                                          │
│    • TCO 3 años: $7,002 (BYOL) — $14,220 (PAYG)                        │
│    • Cero DBA, cero patching, HA incluida                               │
│    • Blockchain Tables para SIC (inmutabilidad verificable)              │
│    • JSON Duality Views para OCPI (30% menos código)                    │
│    • Dev/QA gratis (Always Free 23ai)                                   │
│    • Select AI para reportes admin                                      │
│                                                                          │
│  OPCIÓN ALTERNATIVA (si presupuesto es muy limitado):                   │
│  ──────────────────────────────────────────────────────                  │
│  ★ PostgreSQL 16 en OCI (VM self-managed + Object Storage WORM)         │
│                                                                          │
│    • TCO 3 años: $5,100 infra (+ $21,600 DBA = $26,700 total)          │
│    • $44/mes en DB pura — el más barato                                 │
│    • PostGIS superior para geoespacial                                  │
│    • asyncpg + SQLAlchemy: stack FastAPI perfecto                       │
│    • ⚠️ Requiere DBA: patching, backups, tuning, vacuuming             │
│    • ⚠️ Audit SIC: complementar con Object Storage WORM                │
│                                                                          │
│  OPCIÓN HÍBRIDA (mejor de ambos mundos):                                │
│  ──────────────────────────────────────────────────────                  │
│  ★ Empezar con PostgreSQL VM (Always Free) para PoC/Desarrollo          │
│  ★ Migrar a Oracle Autonomous 23ai para Producción                      │
│                                                                          │
│    • Dev/QA: PostgreSQL en ARM Always Free ($0)                         │
│    • Prod: Oracle Autonomous 23ai BYOL ($117/mes)                       │
│    • Combina costo mínimo en dev + features enterprise en prod          │
│    • ⚠️ Requiere abstracción SQL via SQLAlchemy para portabilidad       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 13.5 Decision Tree Simplificado

```
¿Hay DBA disponible en el equipo?
├── NO → Oracle Autonomous 23ai ★
│        ├── ¿Hay licencias Oracle? → BYOL ($117/mes DB) ★★
│        └── No hay licencias → PAYG ($394/mes DB) o UCM ($264/mes)
│
└── SÍ → ¿El compliance SIC es crítico con verificación criptográfica?
         ├── SÍ → Oracle Autonomous 23ai (Blockchain Tables)
         └── NO → ¿Presupuesto < $200/mes total?
                  ├── SÍ → PostgreSQL VM self-managed ($44/mes DB)
                  └── NO → PostgreSQL OCI Managed ($178/mes DB)
                           o Oracle Autonomous BYOL ($117/mes DB)
```

### 13.6 Acciones Inmediatas

1. **Verificar licencias Oracle** existentes en UPME/MinEnergía (determina si BYOL aplica).
2. **Preguntar al equipo:** ¿Hay experiencia PostgreSQL o Oracle? ¿Hay DBA?
3. **PoC con ambos** (gratis):
   - PostgreSQL: `docker run postgres:16` en local
   - Oracle 23ai: Always Free Autonomous en OCI
4. **Probar compliance SIC:** Evaluar si triggers + pgaudit + WORM son suficientes vs Blockchain Tables.
5. **Medir el costo real de DBA:** ¿Cuántas horas/mes se dedicarán a operar la DB?
6. **Decisión final** basada en datos reales del PoC, no en teoría.

---

### Apéndice: Quick Reference

| Pregunta | PostgreSQL | Oracle 23ai |
|----------|-----------|------------|
| ¿Cuánto cuesta la DB? | **$44-178/mes** | **$117-394/mes** |
| ¿Cuánto cuesta TODO? | **$195-329/mes** | **$268-545/mes** |
| ¿Necesito DBA? | **Sí** (VM) / Parcial (managed) | **No** (Autonomous) |
| ¿Audit inmutable nativo? | **No** (workaround) | **Sí** (Blockchain Tables) |
| ¿JSON OCPI optimizado? | JSONB (bueno) | **JSON Duality** (excelente) |
| ¿HA automática? | **No** (manual) | **Sí** (Data Guard) |
| ¿Dev gratis? | **Sí** (VM ARM) | **Sí** (Always Free) |
| ¿Lock-in? | **No** | **Sí** (OCI/Oracle) |
| ¿PostGIS? | **Sí** (superior) | Spatial (bueno) |
| ¿Vector Search? | pgvector | AI Vector Search |
| ¿Select AI (NL→SQL)?| **No** | **Sí** |
| ¿TCO 3 años (con DBA)?| **$15,783-26,700** | **$7,002-14,220** |
| Driver FastAPI | asyncpg ⭐⭐⭐⭐⭐ | python-oracledb ⭐⭐⭐⭐ |

---

> **Nota:** Esta comparativa asume despliegue en OCI (región Bogotá) para cumplir soberanía de datos. Los precios son estimaciones basadas en listas públicas Q1 2026. El costo DBA se estima en $50/hora (tarifa consultores Colombia). Para decisión final, realizar PoC con ambos motores usando los Always Free tiers disponibles.

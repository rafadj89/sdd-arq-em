# Estimación de Costos — Oracle Database 23ai como Core

## Plataforma de Interoperabilidad UPME Electromovilidad

> **Fecha:** Marzo 2026 | **Versión:** 1.0  
> **Perfil:** ~10 usuarios internos, ~10-50 CPOs integradores  
> **Arquitectura:** Monolito sincrónico (FastAPI) sobre OCI  
> **Database Core:** Oracle Database 23ai  
> **Referencia:** Oracle Well-Architected Framework (WAF)

---

## Tabla de Contenido

1. [¿Por qué Oracle Database 23ai?](#1-por-qué-oracle-database-23ai)
2. [Features 23ai Aplicables a UPME](#2-features-23ai-aplicables-a-upme)
3. [Opciones de Despliegue Oracle 23ai en OCI](#3-opciones-de-despliegue-oracle-23ai-en-oci)
4. [Estimación Detallada por Opción de DB](#4-estimación-detallada-por-opción-de-db)
5. [Costos de Infraestructura Complementaria](#5-costos-de-infraestructura-complementaria)
6. [Escenarios Consolidados (DB + Infra)](#6-escenarios-consolidados-db--infra)
7. [Impacto de 23ai en la Arquitectura](#7-impacto-de-23ai-en-la-arquitectura)
8. [Matriz de Decisión: ¿Cuál opción de DB elegir?](#8-matriz-de-decisión-cuál-opción-de-db-elegir)
9. [Roadmap de Costos por Fase](#9-roadmap-de-costos-por-fase)
10. [Resumen Ejecutivo y Recomendación](#10-resumen-ejecutivo-y-recomendación)

---

## 1. ¿Por qué Oracle Database 23ai?

Oracle Database 23ai es la versión más reciente de Oracle Database, con un enfoque en **inteligencia artificial integrada directamente en el motor de base de datos**. No es solo un nombre comercial — incluye capacidades nativas que eliminan la necesidad de herramientas externas.

### 1.1 Evolución de Versiones

```
Oracle 19c (LTS) → Oracle 21c (Innovation) → Oracle 23ai (LTS + AI)
                                                  ▲
                                                  │
                                          Versión actual recomendada
                                          para nuevos proyectos
```

### 1.2 Disponibilidad en OCI

| Servicio OCI | Oracle 23ai disponible | Notas |
|-------------|----------------------|-------|
| **Autonomous Database Serverless (ATP/ADW)** | ✅ Sí | Default en nuevas instancias |
| **Autonomous Database Dedicated** | ✅ Sí | Infraestructura dedicada |
| **Base Database Service (VM)** | ✅ Sí | Co-managed, VM shapes |
| **Base Database Service (BM)** | ✅ Sí | Bare Metal |
| **Exadata Database Service** | ✅ Sí | Alto rendimiento |
| **Always Free Autonomous DB** | ✅ Sí | 23ai incluido gratis |

> 💡 **Todas las opciones de OCI Database ya corren Oracle 23ai por defecto.** No hay costo adicional por usar 23ai vs versiones anteriores — el costo es por la infraestructura (OCPU + storage), no por la versión del software.

---

## 2. Features 23ai Aplicables a UPME

### 2.1 Mapa de Features → Casos de Uso UPME

| Feature Oracle 23ai | Caso de Uso UPME | Beneficio | ¿Reemplaza algo? |
|---------------------|-----------------|-----------|-------------------|
| **AI Vector Search** | Búsqueda semántica sobre datos OCPI, documentos regulatorios, búsqueda de estaciones por similitud | Buscar estaciones "similares" por características, no solo por coordenadas | Podría reemplazar búsqueda full-text externa |
| **JSON Relational Duality Views** | Datos OCPI llegan como JSON, se almacenan relacional, se sirven como JSON | Una sola tabla sirve tanto a la API REST (JSON) como a reportes SQL (relacional). Zero mapping. | Elimina la necesidad de lógica ORM compleja en FastAPI |
| **Blockchain / Immutable Tables** | Audit trail para SIC — registros que **no se pueden modificar ni borrar** | Cumplimiento SIC sin Object Storage WORM para audit — la propia DB garantiza inmutabilidad | Reduce dependencia de Object Storage WORM para audit |
| **Property Graph (SQL/PGQ)** | Mapeo de relaciones CPO → Estaciones → Conectores → Sesiones | Queries de grafos nativos: "¿qué CPOs comparten infraestructura?" "¿qué estaciones están conectadas?" | Elimina necesidad de Neo4j o grafos externos |
| **True Cache** | Cache de solo lectura automático para consultas públicas de estaciones/precios | Cache a nivel de DB sin código adicional — reemplaza lru_cache para consultas frecuentes | Mejora el in-memory lru_cache actual |
| **Select AI** | Consultas en lenguaje natural para administradores UPME | Admin puede preguntar: "¿Cuántas estaciones reportó Enel esta semana?" sin escribir SQL | Nuevo: no existía en la arquitectura |
| **SQL Domains** | Validación de tipos OCPI a nivel de DB (ej: `DOMAIN ocpi_connector_type AS VARCHAR2(20) CHECK...`) | Validación dual: Pydantic en app + SQL Domains en DB = doble seguridad | Complementa Pydantic v2 |
| **Schema-Level Privileges** | Un schema por ambiente (dev, sandbox) con privilegios granulares | Mejor aislamiento multi-tenant en DB compartida | Mejora la seguridad actual |
| **JSON Schema Validation** | Validación de JSON OCPI 2.2.1 directamente en la DB | Si un JSON OCPI no cumple el schema, la DB lo rechaza antes de llegar a la app | Complementa validación Pydantic |
| **DBMS_CLOUD** | Integración nativa con OCI Object Storage desde SQL | `SELECT * FROM DBMS_CLOUD.get_object(...)` — acceso directo a Object Storage desde queries | Simplifica ETL con Object Storage |
| **Annotations** | Metadatos de negocio en tablas y columnas (ej: `ANNOTATIONS ('description', 'Tabla de CPOs registrados')`) | Auto-documentación del modelo de datos | Nuevo: facilita gobierno de datos |
| **Priority Transactions** | Priorizar transacciones de CPOs en producción sobre consultas de reportes | Garantizar que la ingesta OCPI siempre tiene prioridad | Nuevo: mejora QoS |

---

### 2.2 Arquitectura UPME Potenciada con 23ai

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA UPME + ORACLE 23ai                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────────────┐  │
│  │ CPO (OCPI    │───▶│ FastAPI Monolito  │───▶│  Oracle Database 23ai │  │
│  │  JSON data)  │    │                  │    │                       │  │
│  └──────────────┘    │  • Pydantic v2   │    │  • JSON Duality Views │  │
│                      │  • OAuth 2.0     │    │    (OCPI JSON ↔ SQL)  │  │
│  ┌──────────────┐    │  • CRUD simple   │    │  • Blockchain Tables  │  │
│  │ Admin UPME   │───▶│  • APScheduler   │    │    (Audit SIC)        │  │
│  │              │    │                  │    │  • AI Vector Search   │  │
│  └──────────────┘    └──────────────────┘    │    (Búsqueda semánt.) │  │
│                                              │  • True Cache         │  │
│  ┌──────────────┐    ┌──────────────────┐    │    (Consultas públicas)│  │
│  │ Ciudadano    │───▶│ React + Leaflet  │    │  • SQL Domains        │  │
│  │ (Portal Pub.)│    │ (Frontend)       │    │    (Validación OCPI)  │  │
│  └──────────────┘    └──────────────────┘    │  • Select AI          │  │
│                                              │    (NL queries admin)  │  │
│  ┌──────────────┐                            │  • Property Graph     │  │
│  │ SIC (Audit)  │───────────────────────────▶│    (Relaciones CPO)   │  │
│  │              │    Audit inmutable          │  • DBMS_CLOUD         │  │
│  └──────────────┘                            │    (→ Object Storage)  │  │
│                                              └───────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 ¿Qué simplifica 23ai vs la arquitectura actual?

| Componente actual | Con Oracle 23ai | Ahorro |
|-------------------|----------------|--------|
| Pydantic JSON → ORM → SQL relacional | **JSON Duality Views**: JSON in, JSON out, SQL también | Menos código ORM (~30% menos código en data layer) |
| Object Storage WORM para audit SIC | **Blockchain Tables**: inmutabilidad nativa en DB | Menos complejidad en flujo de auditoría |
| lru_cache en FastAPI | **True Cache**: cache automático a nivel DB | Cache más inteligente, invalidación automática |
| SQL manual para reportes | **Select AI**: lenguaje natural → SQL | Reportes ad-hoc sin desarrollo |
| Búsqueda por filtros estáticos | **AI Vector Search**: búsqueda por similitud | Mejor UX en portal público |
| Validación solo en app (Pydantic) | **JSON Schema + SQL Domains**: validación en DB | Doble capa de seguridad de datos |

---

## 3. Opciones de Despliegue Oracle 23ai en OCI

Oracle 23ai está disponible en **5 servicios OCI**. Para UPME, 3 son relevantes:

### 3.1 Comparativa de Opciones

| Aspecto | Autonomous DB Serverless | Base DB Service (VM) | Base DB Service (BM) |
|---------|-------------------------|---------------------|---------------------|
| **Gestión** | 100% Oracle (fully managed) | Co-managed (Oracle infra, tú DB) | Co-managed |
| **Oracle 23ai** | ✅ Default | ✅ Disponible | ✅ Disponible |
| **Auto-patching** | ✅ Automático | ❌ Manual (scheduling) | ❌ Manual |
| **Auto-tuning** | ✅ Automático | ❌ Manual | ❌ Manual |
| **Auto-scaling** | ✅ Opcional | ❌ No | ❌ No |
| **Data Guard** | ✅ Incluido | ⚠️ Costo adicional | ⚠️ Costo adicional |
| **Backups** | ✅ Automáticos (60 días) | ⚠️ Configurar manual | ⚠️ Configurar manual |
| **RAC (HA)** | ✅ Incluido (Serverless) | ⚠️ Costo adicional (2-node) | ⚠️ Costo adicional |
| **Min OCPU** | 1 OCPU | 1 OCPU (VM.Standard) | 2 OCPU (mínimo BM) |
| **Min Storage** | 20 GB (Free) / 1 TB (paid) | 256 GB | 256 GB |
| **Always Free** | ✅ 2 instancias | ❌ No | ❌ No |
| **BYOL** | ✅ ~75% descuento | ✅ ~50% descuento | ✅ ~50% descuento |
| **OS Access** | ❌ No (fully managed) | ✅ SSH root | ✅ SSH root |
| **Custom extensions** | ⚠️ Limitado | ✅ Completo | ✅ Completo |
| **Features 23ai** | Todos disponibles | Todos disponibles | Todos disponibles |
| **DBA requerido** | ❌ No | ✅ Sí (parcial) | ✅ Sí (completo) |
| **Ideal para** | Apps sin DBA, startups, gobierno | Apps que necesitan control OS | Alto rendimiento |

### 3.2 Opciones Descartadas para UPME

| Opción | Razón de descarte |
|--------|-------------------|
| **Autonomous DB Dedicated** | Mínimo ~$6,000/mes — sobredimensionado para 10 usuarios |
| **Exadata DB Service** | Mínimo ~$10,000/mes — diseñado para millones de tx/seg |
| **Oracle Database@Azure/AWS** | No aplica — la UPME usa OCI |

---

## 4. Estimación Detallada por Opción de DB

### 4.1 Opción A: Autonomous Database 23ai Serverless (RECOMENDADA)

> La misma que estaba en la estimación anterior, pero ahora ejecuta Oracle 23ai por defecto.

#### Producción

| Concepto | Configuración | PAYG | BYOL | Costo/mes PAYG | Costo/mes BYOL |
|----------|--------------|------|------|----------------|----------------|
| **OCPU** | 1 OCPU, 24/7 | $0.5071/hr | $0.1278/hr | **$370.18** | **$93.29** |
| **Storage** | 1 TB | $118.40/TB | $118.40/TB | **$118.40** | **$118.40** |
| **Backup** | Auto 60 días | Incluido | Incluido | **$0.00** | **$0.00** |
| **Data Guard** | Standby automático | Incluido | Incluido | **$0.00** | **$0.00** |
| **Auto-patching 23ai** | Sin downtime | Incluido | Incluido | **$0.00** | **$0.00** |
| **All 23ai features** | Vector, JSON Duality, etc. | Incluido | Incluido | **$0.00** | **$0.00** |
| **Subtotal Prod** | | | | **$488.58** | **$211.69** |

#### Dev/QA (Always Free)

| Concepto | Configuración | Costo/mes |
|----------|--------------|-----------|
| **Autonomous DB 23ai Free** | 1 OCPU, 20 GB, Oracle 23ai completo | **$0.00** |
| Incluye: JSON Duality, Vector Search, Blockchain Tables, Select AI | Todo disponible en Always Free | **$0.00** |

#### Sandbox

| Concepto | Configuración | Costo/mes |
|----------|--------------|-----------|
| **Autonomous DB 23ai Free** (2da instancia) | 1 OCPU, 20 GB | **$0.00** |

#### Escenario con storage optimizado (200 GB)

| Concepto | Costo/mes PAYG | Costo/mes BYOL |
|----------|----------------|----------------|
| 1 OCPU 23ai 24/7 | $370.18 | $93.29 |
| 200 GB Storage | $23.68 | $23.68 |
| **Total DB Prod (200 GB)** | **$393.86** | **$116.97** |

---

### 4.2 Opción B: Base Database Service — VM (Oracle 23ai)

> Más barato en OCPU, pero requiere gestión manual de backups, patching, y tuning.

#### Producción

| Concepto | Configuración | PAYG | BYOL | Costo/mes PAYG | Costo/mes BYOL |
|----------|--------------|------|------|----------------|----------------|
| **VM Shape** | VM.Standard.E4.Flex (1 OCPU, 16 GB) | $0.1020/OCPU/hr | $0.0256/OCPU/hr | **$74.46** | **$18.69** |
| **DB Software** | Oracle 23ai Enterprise Edition | Incluido en OCPU | BYOL | **$0.00** | **$0.00** |
| **Storage (Block)** | 256 GB (mínimo) | $0.0255/GB/mes | $0.0255/GB/mes | **$6.53** | **$6.53** |
| **Storage adicional** | +744 GB (para 1 TB total) | $0.0255/GB/mes | $0.0255/GB/mes | **$18.97** | **$18.97** |
| **Backup (DB Backup)** | Automático a Object Storage | ~$0.0255/GB/mes | ~$0.0255/GB/mes | **~$6.53** | **~$6.53** |
| **Data Guard** (opcional) | Standby VM adicional | = costo de otra VM | = costo de otra VM | **+$74.46** | **+$18.69** |
| **23ai features** | Todos incluidos en EE | — | — | **$0.00** | **$0.00** |
| **Subtotal Prod (sin DG)** | | | | **$106.49** | **$50.72** |
| **Subtotal Prod (con DG)** | | | | **$180.95** | **$69.41** |

#### Ediciones disponibles en Base DB

| Edición | Incluye 23ai features | Precio PAYG/OCPU/hr | Para UPME |
|---------|----------------------|---------------------|-----------|
| **Standard Edition (SE)** | ❌ Sin Vector Search, sin Blockchain Tables, sin Property Graph | $0.0680/OCPU/hr | ⚠️ Faltan features clave |
| **Enterprise Edition (EE)** | ✅ Todos los 23ai features | $0.1020/OCPU/hr | ✅ Recomendado |
| **EE High Performance** | ✅ + Partitioning, Advanced Compression, OLAP | $0.1360/OCPU/hr | ❌ No necesario |
| **EE Extreme Performance** | ✅ + RAC, In-Memory, Active Data Guard | $0.1700/OCPU/hr | ❌ Sobredimensionado |

> ⚠️ **Importante:** Para aprovechar las features clave de 23ai (AI Vector Search, Blockchain Tables, JSON Duality, Property Graph), se requiere **Enterprise Edition** o superior. Standard Edition NO incluye todas las features de 23ai.

#### Dev/QA (Base DB)

| Concepto | Configuración | Costo/mes PAYG |
|----------|--------------|----------------|
| VM.Standard.E4.Flex | 1 OCPU, 16 GB | $74.46 |
| Storage 256 GB | Mínimo | $6.53 |
| **Total Dev/QA** | | **$80.99** |

> ⚠️ **No hay Always Free para Base DB.** Esto agrega ~$81/mes vs Autonomous DB que tiene Always Free.

---

### 4.3 Opción C: Base Database Service — Bare Metal (Oracle 23ai)

> Máximo rendimiento, pero sobredimensionado para UPME.

| Concepto | Shape mínimo | PAYG | Costo/mes PAYG |
|----------|-------------|------|----------------|
| **BM Shape** | BM.Standard.E4.128 (2 OCPU min billing) | $0.1020/OCPU/hr | **$148.92** |
| **Storage** | 256 GB - 40 TB | $0.0255/GB/mes | **$6.53 - $1,020** |
| **Data Guard** | Segundo BM | +$148.92 | **+$148.92** |
| **Subtotal mínimo** | | | **~$155.45** |

> ❌ **No recomendado para UPME.** Bare Metal es para cargas intensivas de I/O. Para 10 usuarios + 50 CPOs, una VM es más que suficiente.

---

### 4.4 Comparativa Directa: Solo Costo de Database (Producción)

| Opción | Config | PAYG/mes | BYOL/mes | Auto-manage | Always Free Dev |
|--------|--------|---------|---------|-------------|-----------------|
| **A: Autonomous Serverless** | 1 OCPU, 1TB | **$488.58** | **$211.69** | ✅ 100% auto | ✅ 2 instancias |
| **A: Autonomous (200 GB)** | 1 OCPU, 200GB | **$393.86** | **$116.97** | ✅ 100% auto | ✅ 2 instancias |
| **B: Base DB VM (EE)** | 1 OCPU, 1TB | **$106.49** | **$50.72** | ❌ Manual | ❌ No |
| **B: Base DB VM + DG** | 1 OCPU, 1TB + standby | **$180.95** | **$69.41** | ❌ Manual | ❌ No |
| **C: Base DB BM (EE)** | 2 OCPU, 256GB | **$155.45** | **$55+** | ❌ Manual | ❌ No |

```
┌────────────────────────────────────────────────────────────────────────┐
│           COSTO MENSUAL DB PRODUCCIÓN — Oracle 23ai (USD)              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Autonomous Serverless 1TB (PAYG)   █████████████████████████  $489    │
│  Autonomous Serverless 200GB (PAYG) ████████████████████░░░░░  $394    │
│  Autonomous Serverless 1TB (BYOL)   ███████████░░░░░░░░░░░░░  $212    │
│  Autonomous Serverless 200GB (BYOL) ██████░░░░░░░░░░░░░░░░░░  $117    │
│  Base DB VM EE (PAYG)               █████░░░░░░░░░░░░░░░░░░░  $106    │
│  Base DB VM EE + DG (PAYG)          █████████░░░░░░░░░░░░░░░  $181    │
│  Base DB VM EE (BYOL)               ██░░░░░░░░░░░░░░░░░░░░░░   $51    │
│  Base DB VM EE + DG (BYOL)          ███░░░░░░░░░░░░░░░░░░░░░   $69    │
│  Base DB BM EE (PAYG)               ████████░░░░░░░░░░░░░░░░  $155    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Costo Total de DB incluyendo Dev/QA + Sandbox

| Opción | Prod | Dev/QA | Sandbox | **Total DB/mes** |
|--------|------|--------|---------|-----------------|
| **A: Autonomous (PAYG, 200GB)** | $393.86 | $0 (Free) | $0 (Free) | **$393.86** |
| **A: Autonomous (BYOL, 200GB)** | $116.97 | $0 (Free) | $0 (Free) | **$116.97** |
| **B: Base DB VM EE (PAYG)** | $106.49 | $80.99 | $80.99 | **$268.47** |
| **B: Base DB VM EE (BYOL)** | $50.72 | $25.22 | $25.22 | **$101.16** |
| **B: Base DB VM EE + DG (PAYG)** | $180.95 | $80.99 | $80.99 | **$342.93** |

> 🔑 **Insight:** Cuando se incluyen los 3 ambientes, Autonomous DB es más competitivo de lo que parece porque Dev/QA y Sandbox son **Always Free**. Base DB VM es más barato en Prod pero **no tiene Always Free**, lo que sube el costo total.

---

## 5. Costos de Infraestructura Complementaria

Estos costos son **iguales independientemente de la opción de DB** elegida:

### 5.1 Compute

| Concepto | Configuración | Costo/mes |
|----------|--------------|-----------|
| **Prod: Backend FastAPI** | 2 OCPU ARM (A1), 8 GB | $14.60 |
| **Prod: Frontend React (NGINX)** | 1 OCPU ARM, 4 GB | $7.30 |
| **Prod: KeyCloak** | 1 OCPU ARM, 4 GB | $7.30 |
| **Dev/QA** | Always Free ARM (4 OCPU, 24 GB) | $0.00 |
| **Sandbox: Backend** | 1 OCPU ARM, 4 GB | $7.30 |
| **Subtotal Compute** | | **$36.50** |

### 5.2 Networking

| Concepto | Costo/mes |
|----------|-----------|
| VCN + Subnets + Security Lists | $0.00 |
| VPN Connect (1 túnel a Cárgame) | $29.20 |
| NAT Gateway | $6.21 |
| Internet + Service Gateway | $0.00 |
| Data Transfer (10 TB free) | $0.00 |
| **Subtotal Networking** | **$35.41** |

### 5.3 Seguridad

| Concepto | Costo/mes |
|----------|-----------|
| OCI WAF (1 policy) | $60.60 |
| OCI Vault (20 keys Free + 10 extra) | $5.30 |
| OCI Certificates | $0.00 |
| OCI Bastion | $0.00 |
| OCI IAM | $0.00 |
| **Subtotal Seguridad** | **$65.90** |

### 5.4 Storage (Object Storage)

| Concepto | Costo/mes |
|----------|-----------|
| Standard (50 GB) | $1.28 |
| Infrequent Access (50 GB) | $0.50 |
| Archive WORM (100 GB) | $0.26 |
| Requests | $0.34 |
| **Subtotal Storage** | **$2.38** |

> 💡 **Con Blockchain Tables de 23ai:** Si se usa Blockchain Tables para audit trail, la necesidad de Object Storage WORM se reduce. El audit inmutable vive en la DB. Object Storage se mantiene solo para backups y exports.

### 5.5 Observabilidad + DevOps

| Concepto | Costo/mes |
|----------|-----------|
| OCI Monitoring (500M free) | $0.00 |
| OCI Logging (10 GB free + 10 GB) | $5.00 |
| OCI DevOps | ~$5.00 |
| OCIR (2 GB) | $0.75 |
| OCI Resource Manager | $0.00 |
| **Subtotal Obs + DevOps** | **$10.75** |

### 5.6 Total Infraestructura Complementaria

| Categoría | Costo/mes |
|-----------|-----------|
| Compute (ARM) | $36.50 |
| Networking | $35.41 |
| Seguridad | $65.90 |
| Object Storage | $2.38 |
| Observabilidad + DevOps | $10.75 |
| **TOTAL INFRA (sin DB)** | **$150.94** |

---

## 6. Escenarios Consolidados (DB + Infra)

### 6.1 Escenario 1: Autonomous DB 23ai Serverless — PAYG

> ✅ **RECOMENDADO** — Mínimo esfuerzo operacional, todas las features 23ai, Always Free para Dev/QA.

| Componente | Costo/mes |
|-----------|-----------|
| **Oracle 23ai Autonomous (Prod, 1 OCPU, 200 GB)** | $393.86 |
| **Oracle 23ai Autonomous (Dev/QA — Free)** | $0.00 |
| **Oracle 23ai Autonomous (Sandbox — Free)** | $0.00 |
| Infraestructura complementaria | $150.94 |
| **TOTAL MENSUAL** | **$544.80** |
| **TOTAL ANUAL** | **$6,537.60** |

### 6.2 Escenario 2: Autonomous DB 23ai Serverless — BYOL

> ✅ Si UPME/MinEnergía tiene licencias Oracle Database vigentes.

| Componente | Costo/mes |
|-----------|-----------|
| **Oracle 23ai Autonomous (Prod, BYOL, 200 GB)** | $116.97 |
| **Oracle 23ai Autonomous (Dev/QA — Free)** | $0.00 |
| **Oracle 23ai Autonomous (Sandbox — Free)** | $0.00 |
| Infraestructura complementaria | $150.94 |
| **TOTAL MENSUAL** | **$267.91** |
| **TOTAL ANUAL** | **$3,214.92** |

### 6.3 Escenario 3: Base DB VM 23ai Enterprise — PAYG

> ⚠️ Más barato en DB, pero requiere DBA + no tiene Always Free.

| Componente | Costo/mes |
|-----------|-----------|
| **Oracle 23ai Base DB VM EE (Prod, 1 OCPU, 1 TB)** | $106.49 |
| **Oracle 23ai Base DB VM EE (Dev/QA, 1 OCPU, 256 GB)** | $80.99 |
| **Oracle 23ai Base DB VM EE (Sandbox, 1 OCPU, 256 GB)** | $80.99 |
| Infraestructura complementaria | $150.94 |
| **TOTAL MENSUAL** | **$419.41** |
| **TOTAL ANUAL** | **$5,032.92** |

### 6.4 Escenario 4: Base DB VM 23ai Enterprise — BYOL

| Componente | Costo/mes |
|-----------|-----------|
| **Oracle 23ai Base DB VM EE (Prod, BYOL)** | $50.72 |
| **Oracle 23ai Base DB VM EE (Dev/QA, BYOL)** | $25.22 |
| **Oracle 23ai Base DB VM EE (Sandbox, BYOL)** | $25.22 |
| Infraestructura complementaria | $150.94 |
| **TOTAL MENSUAL** | **$252.10** |
| **TOTAL ANUAL** | **$3,025.20** |

### 6.5 Escenario 5: Autonomous + UCM Annual Flex (33% descuento)

| Componente | PAYG/mes | UCM/mes |
|-----------|---------|--------|
| Autonomous 23ai (200 GB) + Infra | $544.80 | **$365.02** |
| **TOTAL ANUAL UCM** | | **$4,380.24** |

### 6.6 Escenario 6: Autonomous BYOL + UCM (Máximo ahorro)

| Componente | PAYG/mes | UCM/mes |
|-----------|---------|--------|
| Autonomous BYOL + Infra | $267.91 | **$179.50** |
| **TOTAL ANUAL** | | **$2,154.00** |

---

### 6.7 Tabla Consolidada de Todos los Escenarios

| # | Escenario | Costo/mes | Costo/año | DBA req. | Always Free Dev |
|---|-----------|-----------|-----------|----------|-----------------|
| 1 | **Autonomous 23ai PAYG** | **$544.80** | $6,538 | ❌ No | ✅ Sí |
| 2 | **Autonomous 23ai BYOL** | **$267.91** | $3,215 | ❌ No | ✅ Sí |
| 3 | **Base DB VM EE PAYG** | **$419.41** | $5,033 | ✅ Sí | ❌ No |
| 4 | **Base DB VM EE BYOL** | **$252.10** | $3,025 | ✅ Sí | ❌ No |
| 5 | **Autonomous PAYG + UCM** | **$365.02** | $4,380 | ❌ No | ✅ Sí |
| 6 | **Autonomous BYOL + UCM** | **$179.50** | $2,154 | ❌ No | ✅ Sí |

```
┌────────────────────────────────────────────────────────────────────────────┐
│              COSTO MENSUAL TOTAL — TODOS LOS ESCENARIOS (USD)              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. Autonomous PAYG          ██████████████████████████████░░  $545/mes    │
│  2. Autonomous BYOL          ██████████████░░░░░░░░░░░░░░░░░  $268/mes    │
│  3. Base DB VM EE PAYG       █████████████████████████░░░░░░░  $419/mes    │
│  4. Base DB VM EE BYOL       █████████████░░░░░░░░░░░░░░░░░░  $252/mes    │
│  5. Autonomous PAYG + UCM    ████████████████████░░░░░░░░░░░░  $365/mes    │
│  6. Autonomous BYOL + UCM    █████████░░░░░░░░░░░░░░░░░░░░░░  $180/mes ★ │
│                                                                            │
│  Diseño anterior (referencia) ████████████████████████████████  $3K-5K     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Impacto de 23ai en la Arquitectura

### 7.1 Qué cambia en el código con 23ai

#### a) JSON Relational Duality Views

**Antes (sin 23ai):**
```python
# FastAPI endpoint — manejo manual JSON ↔ SQL
@app.put("/ocpi/2.2.1/locations/{id}")
async def update_location(id: str, data: LocationOCPI):
    validated = data.model_dump()  # Pydantic → dict
    # ORM mapping manual
    stmt = update(Location).where(Location.id == id).values(
        name=validated["name"],
        address=validated["address"],
        coordinates_lat=validated["coordinates"]["latitude"],
        coordinates_lng=validated["coordinates"]["longitude"],
        # ... 20+ campos mapeados manualmente
    )
    await db.execute(stmt)
```

**Con 23ai — JSON Duality View:**
```sql
-- DDL: crear una vez
CREATE JSON RELATIONAL DUALITY VIEW location_dv AS
SELECT JSON {
    '_id': l.location_id,
    'name': l.name,
    'address': l.address,
    'coordinates': JSON {
        'latitude': l.lat,
        'longitude': l.lng
    },
    'evses': [
        SELECT JSON {
            'uid': e.evse_uid,
            'status': e.status,
            'connectors': [
                SELECT JSON {
                    'id': c.connector_id,
                    'standard': c.standard,
                    'power_type': c.power_type
                }
                FROM connectors c WHERE c.evse_id = e.evse_id
            ]
        }
        FROM evses e WHERE e.location_id = l.location_id
    ]
}
FROM locations l;
```

```python
# FastAPI — con 23ai JSON Duality
@app.put("/ocpi/2.2.1/locations/{id}")
async def update_location(id: str, data: dict):
    # JSON entra directo a la DB — la Duality View se encarga del mapping
    await db.execute(
        "UPDATE location_dv v SET v.data = :json WHERE v.data._id = :id",
        {"json": json.dumps(data), "id": id}
    )
    # La DB guarda en tablas relacionales automáticamente
```

> **Resultado:** ~60% menos código en el data layer para endpoints OCPI.

#### b) Blockchain Tables para Audit SIC

```sql
-- Tabla inmutable — ningún usuario puede UPDATE o DELETE
CREATE BLOCKCHAIN TABLE audit_trail (
    audit_id      RAW(16) DEFAULT SYS_GUID(),
    event_type    VARCHAR2(50)   NOT NULL,
    entity_type   VARCHAR2(50)   NOT NULL,
    entity_id     VARCHAR2(100)  NOT NULL,
    actor         VARCHAR2(100)  NOT NULL,
    actor_ip      VARCHAR2(45),
    payload       JSON,
    created_at    TIMESTAMP DEFAULT SYSTIMESTAMP
) NO DROP UNTIL 365 DAYS IDLE
  NO DELETE UNTIL 2555 DAYS AFTER INSERT  -- 7 años retención (SIC)
  HASHING USING "SHA2_512" VERSION "v2";
```

> **Resultado:** Audit trail inmutable garantizado por el motor de DB. SIC puede verificar integridad vía hash SHA-512 integrado. No se necesita Object Storage WORM para este propósito.

#### c) AI Vector Search para Portal Público

```sql
-- Crear vector embeddings de estaciones
ALTER TABLE locations ADD (
    description_vec VECTOR(384, FLOAT32)  -- embedding de la descripción
);

-- Búsqueda por similitud: "estación rápida cerca de centro comercial"
SELECT l.name, l.address,
       VECTOR_DISTANCE(l.description_vec, :query_vector, COSINE) AS similarity
FROM locations l
WHERE VECTOR_DISTANCE(l.description_vec, :query_vector, COSINE) < 0.3
ORDER BY similarity
FETCH FIRST 10 ROWS ONLY;
```

#### d) Select AI para Admin Dashboard

```sql
-- Admin puede consultar en español natural
SELECT AI 'Cuántas estaciones reportó Enel esta semana';
-- Oracle 23ai traduce a SQL automáticamente y retorna el resultado

SELECT AI 'Qué CPOs no han reportado datos en las últimas 24 horas';
-- Genera: SELECT name FROM cpos WHERE last_report_at < SYSTIMESTAMP - INTERVAL '1' DAY
```

> **Nota:** Select AI requiere configuración de un modelo LLM (Oracle GenAI service o API key de un proveedor externo). Costo adicional si se usa Oracle GenAI: ~$0.0005-0.001/query.

---

### 7.2 Features 23ai que NO requieren cambio de código

Estos features funcionan automáticamente una vez activados:

| Feature | Qué hace | Activación |
|---------|---------|------------|
| **Auto-indexing** | Crea/elimina índices según carga real | Automático en Autonomous |
| **SQL Plan Management** | Estabiliza planes de ejecución | Automático |
| **True Cache** | Cache read-only transparente | Config DBA (Base DB) / Auto (Autonomous) |
| **Priority Transactions** | Prioriza ingesta OCPI sobre reportes | Config tag en conexión |
| **Real-Time SQL Monitoring** | Monitoreo de queries lentas | Automático |
| **JSON Schema Validation** | Valida JSON OCPI a nivel de tabla | DDL check constraint |

---

## 8. Matriz de Decisión: ¿Cuál opción de DB elegir?

### 8.1 Scoring por Criterio

| Criterio | Peso | Autonomous Serverless | Base DB VM EE |
|----------|------|----------------------|---------------|
| **Costo total (3 ambientes)** | 25% | ⭐⭐⭐ ($394-545) | ⭐⭐⭐⭐ ($252-419) |
| **Esfuerzo operacional (DBA)** | 25% | ⭐⭐⭐⭐⭐ (cero DBA) | ⭐⭐ (requiere DBA parcial) |
| **Features 23ai disponibles** | 15% | ⭐⭐⭐⭐⭐ (todos) | ⭐⭐⭐⭐⭐ (todos en EE) |
| **HA / DR incluido** | 15% | ⭐⭐⭐⭐⭐ (Data Guard free) | ⭐⭐ (DG cuesta extra) |
| **Always Free Dev/QA** | 10% | ⭐⭐⭐⭐⭐ (2 instancias) | ⭐ (no disponible) |
| **Flexibilidad / control OS** | 5% | ⭐⭐ (no hay SSH) | ⭐⭐⭐⭐⭐ (SSH root) |
| **Auto-patching 23ai** | 5% | ⭐⭐⭐⭐⭐ (automático) | ⭐⭐ (manual scheduling) |

### 8.2 Score Final

| Opción | Score Ponderado | Veredicto |
|--------|----------------|-----------|
| **Autonomous DB 23ai Serverless** | **4.30 / 5.00** | ✅ **RECOMENDADO para UPME** |
| **Base DB VM EE 23ai** | **3.15 / 5.00** | ⚠️ Solo si hay DBA disponible y presupuesto muy limitado |

### 8.3 Justificación

**Autonomous Database 23ai Serverless gana porque:**

1. **UPME no tiene un equipo DBA dedicado** — Autonomous elimina 100% del toil de patching, tuning, backups y HA.
2. **Always Free ahorra ~$162/mes** en Dev/QA + Sandbox que Base DB no ofrece.
3. **Data Guard incluido gratis** — En Base DB cuesta +$74/mes (una segunda VM).
4. **Auto-patching de Oracle 23ai** — Las nuevas features y patches de seguridad se aplican automáticamente sin downtime.
5. **Diferencia de costo real es menor de lo que parece** — Autonomous Prod ($394) vs Base DB total 3 ambientes ($268) = solo $126/mes de diferencia. Pero Autonomous ahorra ~40 horas/mes de DBA.

**Cuándo elegir Base DB VM:**
- Si se necesita SSH al servidor de DB (extensiones custom, Oracle Text config avanzada).
- Si hay un DBA Oracle dedicado disponible en el equipo.
- Si el presupuesto es extremadamente limitado Y se tiene BYOL.

---

## 9. Roadmap de Costos por Fase

### 9.1 Ruta Recomendada: Autonomous DB 23ai Serverless

| Fase | Periodo | DB | Infra | Modelo | Total/mes |
|------|---------|----|----|--------|-----------|
| **PoC** | Mes 1-2 | Free Trial (23ai completo) | Free ARM | Free Trial | **$0-50** |
| **Desarrollo** | Mes 3-5 | Always Free (Dev/QA) + PAYG Sandbox si requerido | Free + Sandbox | PAYG | **$50-200** |
| **Go-Live F1** | Mes 6 | Prod Autonomous 23ai (1 OCPU, 200GB) | Completa | PAYG | **$545** |
| **Estabilización** | Mes 7-9 | Medir consumo real | Completa | PAYG | **$500-600** |
| **Optimización** | Mes 10+ | Negociar UCM basado en consumo real | Completa | UCM | **$365** |
| **Con BYOL** | Mes 10+ | Si hay licencias | Completa | UCM+BYOL | **$180** |

### 9.2 Proyección Anual (Año 1)

| Concepto | Meses | Costo/mes (avg) | Total |
|----------|-------|----------------|------:|
| PoC (Free) | 2 | $25 | $50 |
| Desarrollo | 3 | $125 | $375 |
| Go-Live F1 | 1 | $545 | $545 |
| Operación PAYG | 3 | $545 | $1,635 |
| Operación UCM | 3 | $365 | $1,095 |
| **TOTAL AÑO 1** | **12** | | **$3,700** |

### 9.3 Proyección Año 2+ (operación estable)

| Escenario | Costo anual |
|-----------|------------|
| Autonomous PAYG | ~$6,500 |
| Autonomous UCM | ~$4,380 |
| Autonomous BYOL | ~$3,215 |
| **Autonomous BYOL + UCM** | **~$2,154** |

---

## 10. Resumen Ejecutivo y Recomendación

### 10.1 Oracle 23ai — Valor Agregado para UPME

| Feature 23ai | Valor para UPME | Costo adicional |
|-------------|----------------|-----------------|
| **JSON Relational Duality** | -30% código data layer, OCPI JSON nativo | $0 |
| **Blockchain Tables** | Audit SIC inmutable sin WORM externo | $0 |
| **AI Vector Search** | Búsqueda inteligente de estaciones | $0 |
| **Select AI** | Reportes en lenguaje natural para admin | ~$5-10/mes (LLM API) |
| **SQL Domains** | Doble validación OCPI (app + DB) | $0 |
| **True Cache** | Cache automático sin código | $0 |
| **Property Graph** | Análisis de relaciones CPO-Estación | $0 |
| **Auto-indexing** | Performance sin DBA | $0 |

> **Oracle 23ai no tiene costo adicional sobre Oracle Database.** Todas las features de AI están incluidas en el precio del servicio (Autonomous o Base DB Enterprise Edition).

### 10.2 Opción Recomendada

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   ★  RECOMENDACIÓN: Autonomous Database 23ai Serverless               │
│                                                                        │
│   • Costo mensual: $545 (PAYG) → $365 (UCM) → $180 (BYOL+UCM)       │
│   • Costo anual:   $6,538 → $4,380 → $2,154                          │
│   • DBA requerido: NO                                                  │
│   • HA/DR: INCLUIDO (Data Guard automático)                           │
│   • Dev/QA: GRATIS (Always Free 23ai)                                  │
│   • Features 23ai: TODOS incluidos                                     │
│   • Patching: AUTOMÁTICO                                               │
│                                                                        │
│   Rango de costo total (DB + Infra completa):                          │
│   ┌─────────────────────────────────────────────┐                      │
│   │  $180/mes (BYOL+UCM) ─── $545/mes (PAYG)   │                      │
│   └─────────────────────────────────────────────┘                      │
│                                                                        │
│   vs diseño anterior: $3,000-5,000/mes                                 │
│   AHORRO: 67-96%                                                       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Acciones Inmediatas

1. **Crear cuenta OCI** con Free Trial ($300 créditos, 30 días)
2. **Provisionar Autonomous DB 23ai Always Free** — probar JSON Duality + Blockchain Tables
3. **Validar compatibilidad FastAPI ↔ 23ai features** con python-oracledb driver
4. **Verificar licencias Oracle** existentes en UPME/MinEnergía → aplicar BYOL
5. **Implementar JSON Duality Views** para los 4 módulos OCPI (locations, sessions, CDRs, tariffs)
6. **Crear Blockchain Table** para audit trail SIC como PoC
7. **Contactar Oracle Colombia** para explorar contrato gobierno + Oracle 23ai

### 10.4 Driver Python para Oracle 23ai

```bash
# El driver oficial soporta 100% de las features 23ai
pip install oracledb>=2.0.0

# Incluye soporte para:
# - JSON Duality Views (nativo)
# - AI Vector Search (tipo VECTOR)
# - Blockchain Tables (INSERT normal, la DB garantiza inmutabilidad)
# - DBMS_CLOUD (llamadas desde SQL)
# - Async support (asyncio) para FastAPI
```

```python
# Ejemplo conexión FastAPI + Oracle 23ai Autonomous
import oracledb

# Thin mode (sin Oracle Client) — recomendado para containers
pool = oracledb.create_pool_async(
    user="upme_app",
    password=os.getenv("DB_PASSWORD"),
    dsn="adb.sa-bogota-1.oraclecloud.com:1522/xxx_tp.adb.oraclecloud.com",
    min=2, max=10
)
```

---

> **Nota:** Precios basados en OCI Price List pública (Q1 2026, región Americas). Oracle 23ai está incluido sin costo adicional en todas las opciones de OCI Database. Para cálculo preciso usar [OCI Cost Estimator](https://www.oracle.com/cloud/costestimator.html). Los precios reales para entidades gobierno colombianas pueden ser menores — contactar Oracle Colombia para cotización formal.

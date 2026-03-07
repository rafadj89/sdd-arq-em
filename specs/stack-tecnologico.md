# Stack Tecnológico — Plataforma de Interoperabilidad UPME

> **Perfil de uso:** ~10 usuarios internos UPME, ~10-50 CPOs integradores.  
> **Principio:** Arquitectura monolítica sincrónica. Sin mensajería asíncrona.  
> **El usuario puede esperar la respuesta de la plataforma.**  
> **Prioridad:** Simplicidad operacional sobre escalabilidad prematura.

---

## Backend

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| API principal (monolito) | **Python 3.12+ / FastAPI** | Un solo servicio cubre: OCPI ingesta, validación (Pydantic), CPO management, admin API, portal público API, auditoría. Síncrono. |
| Validación OCPI | **Pydantic v2 (integrado)** | Validación de schemas OCPI 2.2.1 dentro del mismo servicio, sin microservicio separado |
| API Gateway | **OCI API Gateway** | Rate limiting básico, JWT validation, routing. Solo si se necesita separar público vs interno. Opcional en F1 — NGINX reverse proxy es suficiente. |
| Tareas programadas | **APScheduler / cron jobs** | Sincronización periódica con Cárgame (cada 24h), limpieza de datos, reportes. Sin colas ni mensajería. |
| Caché (opcional) | **In-memory (lru_cache / dict)** | 10 usuarios no requieren Redis. Si se necesita persistencia, Redis single instance (no cluster). |

> **Nota:** NO se requiere Kafka, OCI Streaming, OCI Functions, OCI Queue, Service Mesh ni CQRS.  
> El volumen de datos (~10-50 CPOs, ~pocos miles de estaciones) se procesa de forma sincrónica sin problema.

## Frontend

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| Framework | **React 18+ con TypeScript** | Ecosistema maduro, tipado estático |
| Build Tool | **Vite 5+** | Hot reload rápido, bundling optimizado |
| Estilos | **TailwindCSS 3+** | Utility-first, consistencia visual, responsive |
| Componentes UI | **Radix UI + shadcn/ui** | Accesibilidad WCAG 2.1, headless |
| Mapas | **Leaflet** | Visualización de estaciones de carga georreferenciadas. Open-source, sin costo de licencia. |
| Gráficas | **Chart.js / Recharts** | Dashboards operacionales, KPIs |
| Estado | **TanStack Query** | Cache inteligente, sync con servidor |

## Data Layer

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| Base de datos principal | **OCI Autonomous Database (ATP)** | Auto-patching, backups automáticos, Data Guard incluido. Una sola instancia para todo (OCPI data, CPOs, auditoría, usuarios). |
| Almacenamiento archivos | **OCI Object Storage** | Audit logs inmutables (WORM policy para SIC), exportaciones, backups JSON. Sin necesidad de Data Lake medallion completo — un solo bucket con prefijos organizados (raw/, processed/, audit/). |
| ETL / Transformaciones | **SQL scripts + cron** | Para ~10-50 CPOs, transformaciones simples en SQL o Python scripts ejecutados por APScheduler. Sin Spark ni Data Flow. |

> **Eliminado:** TimescaleDB, OCI Data Flow (Spark), OCI Data Catalog, OCI GoldenGate.  
> La escala actual (~miles de registros, no millones) no justifica un Data Lake Enterprise.

## Infraestructura & DevOps

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| Compute | **OCI Container Instances** o **OCI Compute (VM)** | Más simple que OKE. 1-2 containers para backend + frontend. Sin necesidad de Kubernetes para ~10 usuarios. Si el equipo prefiere K8s → OKE 1 nodo (no HA). |
| IaC | **Terraform + OCI Resource Manager** | Módulos por ambiente (Dev/Prod). Menos ambientes = menos complejidad. |
| CI/CD | **OCI DevOps** | Build + deploy pipeline. Sin ArgoCD ni GitOps — deploy directo es suficiente para el equipo pequeño. |
| Registry | **OCIR (OCI Container Registry)** | Almacenamiento de imágenes Docker. Vulnerability scanning. |
| Secrets | **OCI Vault** | API keys CPOs, certificados, secrets de aplicación. |
| Observabilidad | **OCI Monitoring + Logging** | Métricas básicas, logs, alertas por email. Sin Prometheus/Grafana/Jaeger — OCI nativo es suficiente. |
| Backups / DRP | **Autonomous DB backups automáticos + Object Storage cross-region** | Data Guard incluido en ATP. Backup diario Object Storage. Sin Full Stack DR ni warm standby — backup + restore manual es aceptable para 10 usuarios. |

> **Eliminado:** OKE multi-nodo HA, ArgoCD, Service Mesh, OpenTelemetry/Jaeger, Prometheus/Grafana, OCI Full Stack DR.

## Seguridad

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| WAF | **OCI WAF** | OWASP Top 10 (mandatorio regulatorio). Rate limiting básico por CPO. |
| VPN | **OCI VPN Connect (IPSec)** | Túnel hacia Cárgame (mandatorio regulatorio). Un solo túnel suficiente. |
| Auth / IdP | **KeyCloak** | OAuth 2.0 para CPOs (client_credentials), login interno. Puede correr en el mismo Container Instance / VM. |
| Certificados | **OCI Certificates** | TLS para endpoints públicos. mTLS para CPOs que lo requieran. |
| Bastion | **OCI Bastion** | Acceso seguro a la VM/container para mantenimiento. |
| SAST | **SonarQube (en CI)** | Análisis estático en pipeline de build. Sin DAST automatizado inicialmente — pentesting manual antes de Go-Live. |

> **Simplificado:** Sin OCI Network Firewall, sin DPI, sin OWASP ZAP automatizado.  
> Pentesting manual previo a Go-Live es suficiente para la escala.

## Ambientes

| Ambiente | Infraestructura | Propósito |
|---------|----------------|-----------|
| **Local** | Docker Compose | Desarrollo individual, mock Cárgame. Sin Minikube ni K8s local. |
| **Desarrollo / QA** | OCI Container Instance (1 backend + 1 DB compartida) | Integración, pruebas. Un solo ambiente para Dev + QA es suficiente con 10 usuarios. |
| **Sandbox** | OCI Container Instance (separado), datos sintéticos | Ambiente para CPOs. Puede ser mismo infra que Dev/QA si hay restricción de costo. |
| **Producción** | OCI Container Instance o VM, Autonomous DB | Operación real. Backups automáticos. Monitoreo OCI nativo. |

> **Eliminado:** 6 ambientes → **4 ambientes**. Sin DR separado (Autonomous DB lo maneja).  
> Un solo Autonomous DB puede servir Dev+QA con schemas separados.

---

## Comparación: Stack Anterior vs Simplificado

| Aspecto | Antes (sobredimensionado) | Ahora (adecuado) |
|---------|---------------------------|-------------------|
| Arquitectura | Microservicios event-driven | **Monolito sincrónico** |
| Messaging | Kafka/OCI Streaming (10 topics) | **Ninguno — llamadas HTTP síncronas** |
| Servicios backend | 8+ microservicios (Go, Python) | **1 servicio FastAPI (Python)** |
| Patrón datos | CQRS + Event Sourcing | **CRUD simple** |
| Caché | Redis HA cluster | **In-memory (lru_cache)** |
| Data Lake | Medallion Bronze/Silver/Gold + Spark | **Object Storage + SQL scripts** |
| Compute | OKE 3+ nodos HA | **Container Instance o VM** |
| DR | Full Stack DR warm standby | **Autonomous DB backups + Object Storage** |
| Ambientes | 6 (Local, Dev, QA, Sandbox, Prod, DR) | **4 (Local, Dev/QA, Sandbox, Prod)** |
| Observabilidad | Prometheus + Grafana + Jaeger + Fluentd | **OCI Monitoring + Logging nativo** |
| Costo estimado mensual | ~$3,000-5,000 USD | **~$500-1,000 USD** |

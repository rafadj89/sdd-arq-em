# Stack Tecnológico — Plataforma de Interoperabilidad UPME

## Backend

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| Microservicio de Ingesta | **Go 1.22+** | Alta concurrencia, bajo consumo de memoria, ideal para I/O intensivo |
| Validador OCPI | **Python 3.12+** | Ecosistema rico para validación de schemas (Pydantic, jsonschema) |
| API Gateway | **OCI API Gateway / Kong** | Rate limiting, JWT validation, routing nativo |
| Event Streaming | **OCI Streaming (Kafka API)** | Managed, auto-scaling, compatible con Apache Kafka clients |
| Procesamiento Async | **OCI Functions (Serverless)** | Escala a cero, ideal para webhooks y callbacks |
| Cola de mensajes (DLQ) | **OCI Queue** | Managed, retención 7 días, integración nativa con Functions |
| Caché | **Redis (OCI Cache)** | TTL para validaciones Cárgame, session store |
| Service Mesh | **OCI Service Mesh / Istio** | mTLS automático, observabilidad, canary deployments |

## Frontend

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| Framework | **React 18+ con TypeScript** | Ecosistema maduro, tipado estático, componentes reutilizables |
| Build Tool | **Vite 5+** | Hot reload rápido, bundling optimizado |
| Estilos | **TailwindCSS 3+** | Utility-first, consistencia visual, responsive |
| Componentes UI | **Radix UI + shadcn/ui** | Accesibilidad WCAG 2.1, headless, personalizable |
| Mapas | **Leaflet / Mapbox GL** | Visualización de estaciones de carga georreferenciadas |
| Gráficas | **Chart.js / Recharts** | Dashboards operacionales, KPIs en tiempo real |
| Estado | **TanStack Query (React Query)** | Cache inteligente, sync con servidor, optimistic updates |

## Data Layer

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| Base de datos principal | **OCI Autonomous Database (ATP)** | Auto-scaling, auto-patching, Data Guard incluido |
| Time-series | **TimescaleDB sobre OKE** | Métricas de telemetría con retención configurable |
| Data Lake | **OCI Object Storage** | Tiers (Standard/Infrequent/Archive), replicación cross-region |
| ETL | **OCI Data Flow (Apache Spark)** | Managed Spark para transformaciones batch |
| Catálogo | **OCI Data Catalog** | Metadatos, clasificación PII, linaje end-to-end |
| CDC | **OCI GoldenGate** | Replicación en tiempo real, zero-downtime |

## Infraestructura & DevOps

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| Orquestación | **OKE (Oracle Kubernetes Engine)** | Managed K8s, Virtual Nodes, integración nativa OCI |
| IaC | **Terraform + OCI Resource Manager** | Módulos reutilizables por ambiente (Dev/QA/Prod) |
| CI/CD | **OCI DevOps + ArgoCD** | Build pipelines + GitOps deployment |
| Registry | **OCIR (OCI Container Registry)** | Vulnerability scanning, image signing |
| Secrets | **OCI Vault (HSM FIPS 140-2 L3)** | Gestión centralizada de secrets y keys |
| Observabilidad | **OCI Monitoring + Logging Analytics** | Dashboards, alertas, log explorer SQL-like |
| DRP | **OCI Full Stack DR** | Failover automatizado cross-region |

## Seguridad

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| WAF | **OCI WAF** | OWASP Top 10, DDoS L7, reglas custom por CPO |
| VPN | **OCI VPN Connect (IPSec IKEv2)** | Túneles redundantes hacia Cárgame |
| Certificados | **OCI Certificates** | TLS automático, rotación sin downtime |
| Firewall de red | **OCI Network Firewall** | DPI en tráfico VPN |
| Bastion | **OCI Bastion** | Acceso seguro a subnets privadas |
| SAST/DAST | **SonarQube + OWASP ZAP** | Análisis estático y dinámico en pipeline CI |

## Ambientes

| Ambiente | Infraestructura | Propósito |
|---------|----------------|-----------|
| **Local** | Docker Compose + Minikube | Desarrollo individual, mocks de Cárgame y Kafka |
| **Desarrollo (Dev)** | OKE 2 nodos, Autonomous DB compartida | Integración continua, auto-deploy desde `develop` |
| **QA** | OKE 3 nodos, Autonomous DB dedicada | Pruebas de aceptación, compliance OCPI, performance |
| **Sandbox** | OKE 3 nodos, datos sintéticos | Ambiente público para CPOs, mock de certificación |
| **Producción** | OKE 3+ nodos HA, Autonomous DB con Data Guard | Operación real, DRP activo, monitoreo 24/7 |
| **DR (Disaster Recovery)** | Región secundaria OCI, warm standby | Failover automático, RPO < 1h, RTO < 30min |

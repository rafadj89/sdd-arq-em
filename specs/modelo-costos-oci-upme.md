# Modelo de Costos y Contratación OCI — Plataforma UPME Electromovilidad

> **Fecha:** Marzo 2026 | **Versión:** 1.0  
> **Perfil:** ~10 usuarios internos, ~10-50 CPOs integradores  
> **Arquitectura:** Monolito sincrónico (FastAPI) sobre OCI  
> **Referencia:** Oracle Well-Architected Framework (WAF)

---

## Tabla de Contenido

1. [Modelos de Contratación Oracle Cloud](#1-modelos-de-contratación-oracle-cloud)
2. [Inventario de Servicios OCI Requeridos](#2-inventario-de-servicios-oci-requeridos)
3. [Estimación de Costos Detallada por Servicio](#3-estimación-de-costos-detallada-por-servicio)
4. [Escenarios de Costo (3 Niveles)](#4-escenarios-de-costo-3-niveles)
5. [Oracle Well-Architected Framework — Mapeo UPME](#5-oracle-well-architected-framework--mapeo-upme)
6. [Always Free Tier — Recursos Aprovechables](#6-always-free-tier--recursos-aprovechables)
7. [Comparativa: PAYG vs Universal Credits vs Gov](#7-comparativa-payg-vs-universal-credits-vs-gov)
8. [Optimización de Costos](#8-optimización-de-costos)
9. [Roadmap de Gasto por Fase](#9-roadmap-de-gasto-por-fase)
10. [Resumen Ejecutivo](#10-resumen-ejecutivo)

---

## 1. Modelos de Contratación Oracle Cloud

Oracle Cloud Infrastructure ofrece **4 modelos principales** de contratación, cada uno con características específicas de compromiso, descuento y flexibilidad.

### 1.1 Pay As You Go (PAYG)

| Aspecto | Detalle |
|---------|---------|
| **Compromiso** | Ninguno — sin contrato mínimo |
| **Facturación** | Por hora o por unidad consumida |
| **Descuento** | 0% — precio de lista completo |
| **Ventaja** | Flexibilidad total, sin riesgo financiero |
| **Desventaja** | Costo más alto por unidad |
| **Ideal para** | PoC, desarrollo, ambientes no-producción, cargas impredecibles |
| **Cancelación** | Inmediata, sin penalidades |

**Cómo funciona:**
- Se crea una cuenta OCI con tarjeta de crédito o facturación directa.
- Se consume y se paga mensualmente por lo usado.
- Los precios se listan en USD/hora (compute) o USD/GB/mes (storage).

---

### 1.2 Universal Credits Monthly (UCM) — Annual Flex

| Aspecto | Detalle |
|---------|---------|
| **Compromiso** | Mínimo **USD $1,000/mes** (USD $12,000/año). Para gobierno puede negociarse. |
| **Duración** | 1, 2 o 3 años |
| **Descuento** | **~33-60%** sobre PAYG dependiendo del volumen y duración |
| **Ventaja** | Descuento significativo, créditos flexibles entre servicios |
| **Desventaja** | Commit mensual mínimo; créditos no usados se pierden (use-it-or-lose-it) |
| **Ideal para** | Producción estable, cargas predecibles |
| **Overage** | Se factura a tarifa PAYG por exceso |

**Estructura de descuentos UCM típicos:**

| Compromiso Anual | Descuento estimado vs PAYG |
|-----------------|---------------------------|
| $12,000 - $24,000/año | ~33% |
| $24,000 - $60,000/año | ~40% |
| $60,000 - $120,000/año | ~45-50% |
| > $120,000/año | ~50-60% (negociable) |

**Cómo funcionan los Universal Credits:**
- Oracle asigna un "pool" de créditos mensuales (ej: $1,000/mes).
- Los créditos se consumen contra **cualquier servicio OCI** (compute, DB, storage, networking, etc.).
- Cada servicio tiene un **factor de consumo** (SKU rate) que determina cuántos créditos consume por unidad.
- Si el consumo real es menor al commit, los créditos restantes **se pierden** ese mes.
- Si el consumo excede el commit, el exceso se factura a tarifa PAYG.

**Factores de consumo UCM (ejemplos relevantes):**

| Servicio | Unidad | Factor UCM (créditos/unidad/hora) |
|----------|--------|----------------------------------|
| Compute VM (E4 Flex) | OCPU/hora | ~$0.025 |
| Autonomous DB (ATP) | OCPU/hora | ~$0.30 (PAYG ~$0.51) |
| Object Storage Standard | GB/mes | ~$0.0255 |
| Object Storage Archive | GB/mes | ~$0.0026 |
| API Gateway | 1M calls | ~$3.00 |
| VPN Connect | Túnel/hora | ~$0.04 |
| WAF | 1M requests | ~$0.60 |
| Vault (keys) | Key version/mes | ~$0.53 |
| Container Instances | OCPU/hora | ~$0.025 |
| Logging | GB ingest/mes | ~$0.50 |
| Monitoring | 1000 data points | Incluido (primeros 500M) |

---

### 1.3 Bring Your Own License (BYOL)

| Aspecto | Detalle |
|---------|---------|
| **Requisito** | Licencias Oracle existentes con Software Update License & Support (SULS) activo |
| **Descuento** | **~50-75%** en servicios elegibles (principalmente Autonomous DB, Compute) |
| **Aplica a** | Oracle Database, Oracle WebLogic, Oracle Java SE, Oracle Analytics |
| **Ideal para** | Organizaciones con contratos Oracle on-premise vigentes |

**Relevancia para UPME:**
- Si la UPME o MinEnergía tienen licencias Oracle Database vigentes, el costo de **Autonomous Database ATP baja ~50%**.
- De $0.51/OCPU/hora PAYG → **~$0.13/OCPU/hora BYOL**.
- Esto puede representar un ahorro de **~$200-400/mes** solo en base de datos.

> ⚠️ **Acción requerida:** Verificar si la UPME tiene licencias Oracle Database activas con soporte. Si las tiene, aplicar BYOL al Autonomous ATP.

---

### 1.4 Oracle Cloud Free Tier

Oracle ofrece dos niveles gratuitos:

#### a) 30-Day Free Trial
- **USD $300** en créditos gratuitos por 30 días.
- Acceso a todos los servicios OCI.
- Ideal para PoC y evaluación.

#### b) Always Free Resources (permanentes, sin límite de tiempo)

| Recurso | Cantidad Always Free |
|---------|---------------------|
| **Compute** (VM.Standard.A1.Flex — ARM) | 4 OCPUs + 24 GB RAM (total, divisible) |
| **Compute** (VM.Standard.E2.1.Micro — AMD) | 2 instancias |
| **Autonomous Database** | 2 instancias × 1 OCPU + 20 GB storage cada una |
| **Object Storage** | 20 GB Standard + 20 GB Archive |
| **Block Volume** | 200 GB (2 volumes × 50 GB + 5 backups × 50 GB) |
| **Load Balancer** | 1 instancia (10 Mbps) |
| **Monitoring** | 500M data points ingest + 1B retrieval |
| **Logging** | 10 GB/mes |
| **Notifications** | 1M por HTTPS, 1000 email |
| **Vault** | 20 key versions |
| **Bastion** | 5 sesiones concurrentes |
| **Container Registry (OCIR)** | 500 MB |
| **VCN + Networking** | 2 VCNs, 1 DRG, 2 IPSec tunnels |
| **Resource Manager (Terraform)** | Ilimitado |
| **OCI DevOps** | Incluido (limitado) |

> 💡 **Para UPME:** Los Always Free resources pueden cubrir completamente el ambiente **Dev/QA** y parcialmente el **Sandbox**, reduciendo el costo total ~$150-300/mes.

---

### 1.5 Oracle Government Cloud

| Aspecto | Detalle |
|---------|---------|
| **Disponibilidad** | Oracle Government Cloud (OC2/OC3) o OCI Commercial con contrato Gov |
| **Requisito** | Entidad gubernamental o contratista autorizado |
| **Beneficios** | Compliance FedRAMP, precios negociados, soporte dedicado |
| **Descuento** | **Negociable** — típicamente alineado con UCM + descuentos adicionales por ser gobierno |
| **Colombia** | OCI region **Bogotá (BOG)** disponible desde 2024. Región dedicada Colombia cumple requisitos de soberanía de datos. |

**Ventajas específicas gobierno Colombia:**
- **Residencia de datos:** Región OCI Bogotá garantiza datos en territorio colombiano (Ley 1581/2012).
- **Contratación:** Compatible con procesos de contratación estatal colombiana (Colombia Compra Eficiente puede facilitar).
- **Oracle Support Rewards:** Si la UPME ya paga soporte Oracle on-premise, puede recibir créditos OCI equivalentes al 25-33% del gasto en soporte.

---

### 1.6 Resumen Comparativo de Modelos

| Modelo | Descuento | Compromiso | Riesgo | Recomendación UPME |
|--------|-----------|------------|--------|---------------------|
| **PAYG** | 0% | Ninguno | Bajo | ✅ Desarrollo, PoC, inicio |
| **UCM 1 año** | ~33% | $12K-24K/año | Medio | ✅ **Producción (recomendado)** |
| **UCM 3 años** | ~45-50% | $36K-72K/año | Alto | ⚠️ Solo si hay certeza presupuestal |
| **BYOL** | ~50-75% en DB | Licencias existentes | Bajo | ✅ Si hay licencias Oracle vigentes |
| **Free Tier** | 100% | Ninguno | Bajo | ✅ **Dev/QA obligatorio** |
| **Gov Cloud** | Negociable | Contrato gov | Bajo | ✅ Explorar si aplica para UPME |

---

## 2. Inventario de Servicios OCI Requeridos

Basado en la arquitectura simplificada aprobada (`stack-tecnologico.md`):

### 2.1 Servicios Core (obligatorios)

| # | Servicio OCI | Uso en UPME | Categoría |
|---|-------------|-------------|-----------|
| 1 | **OCI Autonomous Database (ATP)** | BD principal: OCPI data, CPOs, auditoría, usuarios | Data |
| 2 | **OCI Object Storage** | Audit logs WORM (SIC), backups, exports | Storage |
| 3 | **OCI Container Instances** | Backend FastAPI + Frontend React (3 ambientes) | Compute |
| 4 | **OCI VCN (Virtual Cloud Network)** | Networking: subnets, security lists, route tables | Networking |
| 5 | **OCI WAF** | OWASP Top 10, rate limiting, DDoS L7 | Security |
| 6 | **OCI VPN Connect** | Túnel IPSec hacia Cárgame | Networking |
| 7 | **OCI Vault** | API keys CPOs, certificados, secrets | Security |
| 8 | **OCI Certificates** | TLS endpoints públicos, mTLS CPOs | Security |
| 9 | **OCI Bastion** | Acceso seguro a mantenimiento | Security |
| 10 | **OCI DevOps** | CI/CD pipeline | DevOps |
| 11 | **OCIR (Container Registry)** | Imágenes Docker | DevOps |
| 12 | **OCI Monitoring** | Métricas, alertas | Observability |
| 13 | **OCI Logging** | Logs centralizados | Observability |
| 14 | **OCI Resource Manager** | Terraform IaC | DevOps |
| 15 | **OCI IAM** | Identity, compartments, policies | Security |

### 2.2 Servicios Opcionales (Fase 2+)

| # | Servicio OCI | Uso potencial | Cuándo |
|---|-------------|--------------|--------|
| 16 | **OCI API Gateway** | Rate limiting avanzado, JWT validation | Si se separa público vs interno |
| 17 | **OCI Notifications** | Alertas email, integración Slack | Si se requiere multi-canal |
| 18 | **OCI Load Balancer** | Balanceo si se escala a múltiples instancias | Si >50 CPOs |
| 19 | **OCI DNS** | DNS management | Si se migra DNS a OCI |

### 2.3 Servicios Gratuitos (incluidos sin costo adicional)

| Servicio | Notas |
|----------|-------|
| **OCI IAM** | Identidades, compartments, policies — siempre gratuito |
| **OCI Resource Manager** | Terraform management — siempre gratuito |
| **OCI Cloud Shell** | Terminal cloud-based — siempre gratuito |
| **OCI Monitoring** (básico) | Primeros 500M data points — gratuito |
| **OCI Notifications** | Primeros 1M HTTPS — gratuito |
| **VCN, Subnets, Security Lists** | Sin costo por el networking base |
| **OCI Bastion** | Sin costo por el servicio (solo paga compute subyacente si aplica) |

---

## 3. Estimación de Costos Detallada por Servicio

> **Nota:** Precios basados en OCI Price List (región Americas — Bogotá/Ashburn). Los precios pueden variar ligeramente por región. Precios en **USD**.

### 3.1 Compute — OCI Container Instances

| Concepto | Configuración | Precio Unitario | Cantidad | Costo Mensual |
|----------|--------------|----------------|----------|---------------|
| **Prod: Backend FastAPI** | 2 OCPU, 8 GB RAM | $0.025/OCPU/hr | 730 hrs | $36.50 |
| **Prod: Frontend (NGINX + static)** | 1 OCPU, 4 GB RAM | $0.025/OCPU/hr | 730 hrs | $18.25 |
| **Prod: KeyCloak** | 1 OCPU, 4 GB RAM | $0.025/OCPU/hr | 730 hrs | $18.25 |
| **Dev/QA: Backend + KC** | 1 OCPU, 4 GB RAM | Always Free (ARM) | — | **$0.00** |
| **Sandbox: Backend** | 1 OCPU, 4 GB RAM | $0.025/OCPU/hr | 730 hrs | $18.25 |
| **Subtotal Compute** | | | | **$91.25** |

> **Alternativa VM (E4 Flex):** Si se prefiere VM en lugar de Container Instances, el precio es similar: ~$0.025/OCPU/hr para E4 Flex (AMD). ARM (A1) es ~$0.01/OCPU/hr (~60% más barato).

**Opción ARM (Ampere A1) para reducir costos:**

| Concepto | Configuración | Precio Unitario | Costo Mensual |
|----------|--------------|----------------|---------------|
| Prod: Backend + KC + Frontend | 4 OCPU, 16 GB (ARM) | $0.01/OCPU/hr | **$29.20** |
| Dev/QA | Always Free ARM | — | **$0.00** |
| Sandbox | 1 OCPU ARM | $0.01/OCPU/hr | **$7.30** |
| **Subtotal ARM** | | | **$36.50** |

---

### 3.2 Database — OCI Autonomous Database (ATP)

| Concepto | Configuración | Precio PAYG | Precio BYOL | Costo/mes (PAYG) | Costo/mes (BYOL) |
|----------|--------------|------------|-------------|------------------|-----------------|
| **Prod ATP** | 1 OCPU, auto-scaling off | $0.5071/OCPU/hr | $0.1278/OCPU/hr | **$370.18** | **$93.29** |
| **Prod Storage** | 1 TB (incluye 20 GB free) | $118.40/TB/mes | $118.40/TB/mes | **$118.40** | **$118.40** |
| **Dev/QA ATP** | Always Free | — | — | **$0.00** | **$0.00** |
| **Prod Backups** | Auto (incluido) | Incluido en OCPU | — | **$0.00** | **$0.00** |
| **Subtotal DB (PAYG)** | | | | **$488.58** | — |
| **Subtotal DB (BYOL)** | | | | — | **$211.69** |

> 💡 **Optimización:** Con 1 OCPU ATP y auto-scaling deshabilitado, la DB opera 24/7 a costo fijo. Si la carga es baja (10 usuarios), se puede considerar **parar la DB en horario nocturno** (ej: 10pm-6am) para ahorrar ~33% → ~$246/mes PAYG.

> ⚠️ **Storage 1 TB:** Para ~10-50 CPOs y miles de registros, **200 GB** puede ser suficiente inicialmente. Si se reduce a 200 GB: $118.40 × 0.2 = **$23.68/mes** en storage.

**Escenario DB optimizado (200 GB, PAYG):**

| Concepto | Costo/mes |
|----------|-----------|
| 1 OCPU ATP 24/7 | $370.18 |
| 200 GB Storage | $23.68 |
| **Total DB optimizado** | **$393.86** |

---

### 3.3 Storage — OCI Object Storage

| Concepto | Volumen estimado | Precio | Costo/mes |
|----------|-----------------|--------|-----------|
| **Standard Tier** (datos activos) | 50 GB | $0.0255/GB/mes | **$1.28** |
| **Infrequent Access** (backups) | 50 GB | $0.01/GB/mes | **$0.50** |
| **Archive** (audit WORM) | 100 GB | $0.0026/GB/mes | **$0.26** |
| **Requests** (PUT/GET/LIST) | ~100K/mes | $0.0034/1K requests | **$0.34** |
| **Data Transfer** (outbound) | Primeros 10 TB: gratis | $0.00 | **$0.00** |
| **Subtotal Storage** | | | **$2.38** |

> 💡 **OCI ofrece 10 TB/mes de egress gratis** — una ventaja enorme vs AWS/Azure/GCP que cobran ~$0.09/GB. Para UPME esto es efectivamente costo $0 en transferencia.

---

### 3.4 Networking

| Concepto | Configuración | Precio | Costo/mes |
|----------|--------------|--------|-----------|
| **VCN** | 1 VCN, 3 subnets | Gratuito | **$0.00** |
| **VPN Connect (IPSec)** | 1 túnel a Cárgame | $0.04/túnel/hr | **$29.20** |
| **Internet Gateway** | 1 | Gratuito | **$0.00** |
| **NAT Gateway** | 1 | $0.0085/hr | **$6.21** |
| **Service Gateway** | 1 (acceso a OCI services) | Gratuito | **$0.00** |
| **Data Transfer (outbound)** | 10 TB/mes gratis | $0.00 | **$0.00** |
| **Subtotal Networking** | | | **$35.41** |

> **Nota:** Si se requiere un segundo túnel VPN para redundancia: +$29.20/mes.

---

### 3.5 Seguridad

| Concepto | Configuración | Precio | Costo/mes |
|----------|--------------|--------|-----------|
| **OCI WAF** | 1 policy, ~1M requests/mes | $0.60/1M requests + $60/policy | **$60.60** |
| **OCI Vault** | 20 key versions (Always Free) | Gratuito (primeras 20) | **$0.00** |
| **OCI Vault** (si >20 keys) | 10 keys adicionales | $0.53/key version/mes | **$5.30** |
| **OCI Certificates** | 5 certificados | Incluido | **$0.00** |
| **OCI Bastion** | 5 sesiones concurrentes | Incluido (Always Free) | **$0.00** |
| **OCI IAM** | Identidades + policies | Siempre gratuito | **$0.00** |
| **Subtotal Seguridad** | | | **$65.90** |

---

### 3.6 Observabilidad

| Concepto | Configuración | Precio | Costo/mes |
|----------|--------------|--------|-----------|
| **OCI Monitoring** | ~100M data points/mes | Gratis (primeros 500M) | **$0.00** |
| **OCI Logging** | ~20 GB/mes ingest | $0.50/GB (primeros 10 GB gratis) | **$5.00** |
| **OCI Logging Analytics** (opcional) | 10 GB/mes | $0.80/GB | **$8.00** |
| **Alarms** | 10 alarmas | Gratis (primeras 200) | **$0.00** |
| **Notifications** | ~5K emails/mes | Gratis (primeros 1M HTTPS) | **$0.00** |
| **Subtotal Observabilidad** | | | **$5.00 - $13.00** |

---

### 3.7 DevOps & Registry

| Concepto | Configuración | Precio | Costo/mes |
|----------|--------------|--------|-----------|
| **OCI DevOps** | Build + deploy pipelines | Incluido (paga solo compute de build) | ~**$5.00** |
| **OCIR (Container Registry)** | ~2 GB de imágenes | Primeros 500 MB gratis, luego $0.50/GB | **$0.75** |
| **OCI Resource Manager** | Terraform stacks | Siempre gratuito | **$0.00** |
| **Subtotal DevOps** | | | **$5.75** |

---

### 3.8 API Gateway (Opcional — Fase 2)

| Concepto | Configuración | Precio | Costo/mes |
|----------|--------------|--------|-----------|
| **OCI API Gateway** | 1 gateway, ~500K calls/mes | $3.00/1M calls | **$1.50** |
| **Subtotal API GW** | | | **$1.50** |

> En Fase 1, NGINX reverse proxy es suficiente. API Gateway se agrega si se necesita separar tráfico público vs interno.

---

## 4. Escenarios de Costo (3 Niveles)

### 4.1 Escenario Mínimo — "Arranque Lean"

> Usar Always Free al máximo + ARM compute + DB optimizada + solo servicios esenciales.

| Servicio | Configuración | Costo/mes |
|----------|--------------|-----------|
| Compute (ARM A1) | 4 OCPU Prod + Free Dev/QA | $29.20 |
| Autonomous DB (PAYG) | 1 OCPU, 200 GB, sin Sandbox DB | $393.86 |
| Object Storage | 100 GB total | $2.38 |
| VPN Connect | 1 túnel | $29.20 |
| WAF | 1 policy | $60.60 |
| Vault | 20 keys (Free) | $0.00 |
| Monitoring + Logging | Básico | $5.00 |
| DevOps + OCIR | Básico | $5.75 |
| NAT Gateway | 1 | $6.21 |
| **TOTAL MÍNIMO** | | **$532.20/mes** |
| **TOTAL ANUAL** | | **~$6,387/año** |

---

### 4.2 Escenario Recomendado — "Producción Estable"

> Ambientes separados, seguridad completa, monitoreo adecuado.

| Servicio | Configuración | Costo/mes |
|----------|--------------|-----------|
| Compute (Container Instances) | Prod (4 OCPU) + Sandbox (1 OCPU) + Free Dev | $91.25 |
| Autonomous DB (PAYG) | 1 OCPU, 1 TB, 24/7 | $488.58 |
| Object Storage | 200 GB total | $4.00 |
| VPN Connect | 1 túnel (+ 1 redundante) | $58.40 |
| WAF | 1 policy | $60.60 |
| Vault | 30 keys | $5.30 |
| API Gateway | 1 gateway | $1.50 |
| Monitoring + Logging | Completo | $13.00 |
| DevOps + OCIR | Completo | $5.75 |
| NAT Gateway | 1 | $6.21 |
| Certificates | 5 certs | $0.00 |
| Bastion | Always Free | $0.00 |
| **TOTAL RECOMENDADO** | | **$734.59/mes** |
| **TOTAL ANUAL** | | **~$8,815/año** |

---

### 4.3 Escenario con BYOL — "Si hay licencias Oracle"

> Mismo que recomendado pero con BYOL en Autonomous DB.

| Servicio | Configuración | Costo/mes |
|----------|--------------|-----------|
| Compute | Igual a Recomendado | $91.25 |
| Autonomous DB (**BYOL**) | 1 OCPU, 1 TB | $211.69 |
| Resto de servicios | Igual | $154.76 |
| **TOTAL BYOL** | | **$457.70/mes** |
| **TOTAL ANUAL** | | **~$5,492/año** |

---

### 4.4 Escenario con UCM — "Annual Flex"

> Contrato anual con descuento ~33%.

| Escenario base | PAYG/mes | UCM/mes (~33% dto) | Ahorro/año |
|----------------|---------|--------------------|-----------:|
| Mínimo | $532 | **~$356** | ~$2,112 |
| Recomendado | $735 | **~$492** | ~$2,916 |
| BYOL + UCM | $458 | **~$307** | ~$1,812 |

---

### 4.5 Resumen Visual de Escenarios

```
┌──────────────────────────────────────────────────────────────────┐
│                    COSTO MENSUAL ESTIMADO (USD)                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Mínimo (PAYG)        ████████████████░░░░░░░░░░░░  $532/mes    │
│  Mínimo (UCM)         ███████████░░░░░░░░░░░░░░░░░  $356/mes    │
│  Recomendado (PAYG)   ██████████████████████░░░░░░░  $735/mes    │
│  Recomendado (UCM)    ███████████████░░░░░░░░░░░░░░  $492/mes    │
│  BYOL (PAYG)          ██████████████░░░░░░░░░░░░░░░  $458/mes    │
│  BYOL + UCM           ██████████░░░░░░░░░░░░░░░░░░░  $307/mes    │
│                                                                  │
│  Stack Anterior (est) ██████████████████████████████  $3K-5K/mes │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Oracle Well-Architected Framework — Mapeo UPME

El Oracle Well-Architected Framework (WAF) define **6 pilares** para diseñar soluciones cloud óptimas. A continuación el mapeo de cada pilar a la arquitectura UPME.

### 5.1 Pilar 1: Security and Compliance

> *"Proteger datos, sistemas y activos aprovechando las tecnologías cloud para mejorar la postura de seguridad."*

| Principio WAF | Implementación UPME | Servicio OCI | Costo |
|---------------|---------------------|-------------|-------|
| **Defense in depth** | WAF → API GW/NGINX → App → DB | OCI WAF, Security Lists, NSGs | ~$61/mes |
| **Least privilege** | IAM policies, compartments por ambiente | OCI IAM | Gratuito |
| **Encrypt at rest** | ATP auto-encrypts, Object Storage encryption | Autonomous DB, OCI Vault | Incluido |
| **Encrypt in transit** | TLS 1.3 everywhere, mTLS para CPOs | OCI Certificates | Gratuito |
| **Secrets management** | API keys, JWT secrets en Vault | OCI Vault (HSM FIPS 140-2) | ~$5/mes |
| **Network isolation** | VCN con subnets público/privado | VCN, NSGs | Gratuito |
| **VPN connectivity** | IPSec IKEv2 a Cárgame | OCI VPN Connect | ~$29/mes |
| **Identity federation** | KeyCloak (OAuth 2.0), LDAP federation | KeyCloak (self-hosted) | Compute |
| **Audit trail** | WORM storage para SIC | Object Storage (retention rules) | ~$0.26/mes |
| **Vulnerability scanning** | OCIR vulnerability scanning, SonarQube CI | OCIR, OCI DevOps | Incluido |
| **Compliance** | Datos en Colombia (OCI Bogotá), Ley 1581 | Región BOG | — |

**Score WAF Security: ✅ Alto** — La arquitectura cubre OWASP Top 10, cifrado E2E, secrets management, audit trail inmutable, y soberanía de datos.

---

### 5.2 Pilar 2: Reliability and Resilience

> *"Diseñar sistemas que se recuperen de fallos y continúen funcionando."*

| Principio WAF | Implementación UPME | Servicio OCI | Costo |
|---------------|---------------------|-------------|-------|
| **Automated backups** | Autonomous DB: backups automáticos 60 días | ATP (incluido) | Incluido |
| **Data Guard** | Standby DB incluido en ATP | ATP Data Guard | Incluido |
| **Cross-region backup** | Object Storage replication | OCI Object Storage | ~$2/mes |
| **Health checks** | OCI Monitoring health checks | Monitoring | Gratuito |
| **Alerting** | Alarmas por email/Slack | OCI Alarms + Notifications | Gratuito |
| **Recovery automation** | Terraform para recrear infra | OCI Resource Manager | Gratuito |
| **Graceful degradation** | FastAPI circuit breaker para Cárgame | In-app (tenacity library) | $0 |

**RPO/RTO para UPME:**

| Métrica | Valor | Mecanismo |
|---------|-------|-----------|
| **RPO (Recovery Point Objective)** | ~1 hora | ATP auto-backups cada hora |
| **RTO (Recovery Time Objective)** | ~2-4 horas | Restore manual ATP + Terraform apply infra |
| **Data Guard failover** | ~30 segundos | Automático (incluido en ATP) |

**Score WAF Reliability: ✅ Adecuado** — Para 10 usuarios, RPO 1h / RTO 2-4h es aceptable. Data Guard automático cubre la mayoría de escenarios.

---

### 5.3 Pilar 3: Performance and Cost Optimization

> *"Usar recursos de manera eficiente y eliminar el desperdicio."*

| Principio WAF | Implementación UPME | Ahorro |
|---------------|---------------------|--------|
| **Right-sizing** | 1 OCPU ATP (no 4), 2-4 OCPU compute (no 16) | ~$2,000/mes vs sobredimensionado |
| **Always Free** | Dev/QA en Always Free (ARM + ATP Free) | ~$200/mes |
| **ARM compute** | A1 Flex (~60% más barato que x86) | ~$55/mes |
| **Auto-scaling off** | Carga predecible para 10 usuarios | Evita picos de costo |
| **Storage tiering** | Standard → Infrequent → Archive por ciclo de vida | ~$5/mes |
| **Data transfer** | OCI ofrece 10 TB/mes egress gratis | ~$100/mes vs otros clouds |
| **Stop non-prod** | Parar Sandbox fuera de horario (script cron) | ~$10-15/mes |
| **UCM commitment** | Contrato anual vs PAYG | ~33% ahorro |

**Distribución del costo (escenario Recomendado PAYG):**

```
┌─────────────────────────────────────────────────────┐
│          DISTRIBUCIÓN DE COSTO MENSUAL              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Autonomous DB    ██████████████████████████  66.5%  │
│  Compute          ███████░░░░░░░░░░░░░░░░░░  12.4%  │
│  WAF              ████░░░░░░░░░░░░░░░░░░░░░   8.2%  │
│  VPN              ████░░░░░░░░░░░░░░░░░░░░░   7.9%  │
│  Observabilidad   █░░░░░░░░░░░░░░░░░░░░░░░░   1.8%  │
│  Storage          ░░░░░░░░░░░░░░░░░░░░░░░░░   0.5%  │
│  DevOps/Otros     █░░░░░░░░░░░░░░░░░░░░░░░░   2.7%  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

> 🔑 **Insight clave:** El **Autonomous Database** representa ~66% del costo total. Las palancas principales de optimización son:
> 1. **BYOL** (-$277/mes)
> 2. **Reducir storage** a 200 GB (-$95/mes)
> 3. **UCM** (-33% en todo)

**Score WAF Cost Optimization: ✅ Alto** — El stack simplificado ya elimina ~80% del costo del diseño original ($3K-5K → $500-750).

---

### 5.4 Pilar 4: Operational Efficiency

> *"Automatizar operaciones, reducir toil, y habilitar observabilidad."*

| Principio WAF | Implementación UPME | Servicio OCI |
|---------------|---------------------|-------------|
| **Infrastructure as Code** | Terraform modules por ambiente | OCI Resource Manager |
| **CI/CD automation** | Build + deploy automatizado | OCI DevOps |
| **Autonomous operations** | DB auto-patching, auto-tuning | Autonomous DB |
| **Centralized logging** | Logs unificados | OCI Logging |
| **Proactive monitoring** | Alertas antes de que falle | OCI Monitoring + Alarms |
| **Runbook automation** | Scripts de mantenimiento | Cron + APScheduler |
| **Configuration management** | Secrets centralizados | OCI Vault |

**Beneficio Autonomous DB:**
- Auto-patching (sin downtime para patches de seguridad)
- Auto-tuning (optimización automática de queries)
- Auto-scaling (si se habilita en el futuro)
- Backups automáticos (sin intervención)
- Data Guard automático (failover <30s)

**Score WAF Operational Efficiency: ✅ Alto** — Autonomous DB elimina ~80% del toil de DBA. IaC + CI/CD automatiza deploys.

---

### 5.5 Pilar 5: Performance Efficiency

> *"Usar recursos computacionales de manera eficiente para cumplir requisitos del sistema."*

| Principio WAF | Implementación UPME | Detalle |
|---------------|---------------------|---------|
| **Right compute** | Container Instances (no K8s) | Overhead mínimo para 10 usuarios |
| **Database performance** | ATP con auto-indexing | Optimización automática sin DBA |
| **Caching** | In-memory lru_cache | Sin Redis, suficiente para 10 usuarios |
| **Network latency** | Región Bogotá (local) | <10ms latencia a CPOs colombianos |
| **Object Storage** | Multi-part upload, range GET | Optimizado para audit logs grandes |
| **Connection pooling** | SQLAlchemy pool en FastAPI | Reutilización eficiente de conexiones DB |

**Score WAF Performance: ✅ Adecuado** — 1 OCPU ATP + 2-4 OCPU compute son más que suficientes para el volumen esperado (~pocos miles de registros, ~10-50 CPOs).

---

### 5.6 Pilar 6: Sustainability

> *"Minimizar el impacto ambiental de los workloads cloud."*

| Principio WAF | Implementación UPME |
|---------------|---------------------|
| **ARM compute** | Ampere A1 consume ~60% menos energía que x86 |
| **Right-sizing** | No sobredimensionar reduce desperdicio |
| **Serverless donde posible** | Container Instances solo cuando hay carga |
| **Object Storage lifecycle** | Mover datos fríos a Archive reduce storage activo |
| **Región local** | Bogotá reduce latencia y hops de red internacionales |

---

## 6. Always Free Tier — Recursos Aprovechables

**Plan de uso Always Free para UPME:**

| Recurso Always Free | Asignación UPME | Ambiente |
|---------------------|----------------|----------|
| 4 OCPU + 24 GB ARM (A1) | Backend Dev/QA (2 OCPU, 12 GB) + Frontend Dev/QA (1 OCPU, 6 GB) + KeyCloak Dev (1 OCPU, 6 GB) | Dev/QA |
| 2× AMD Micro (1/8 OCPU, 1 GB) | Monitoring agent, cron jobs | Dev/QA |
| 2× Autonomous DB (1 OCPU, 20 GB) | DB Dev/QA (1 inst) + DB Sandbox (1 inst) | Dev/QA + Sandbox |
| 20 GB Object Storage | Audit logs Dev/QA | Dev/QA |
| 200 GB Block Volume | Boot volumes Dev/QA | Dev/QA |
| 1 Load Balancer (10 Mbps) | LB Dev/QA | Dev/QA |
| 10 GB/mes Logging | Logs Dev/QA | Dev/QA |
| 500M Monitoring data points | Métricas todos los ambientes | Todos |
| 20 Vault key versions | Secrets Dev/QA | Dev/QA |
| 5 Bastion sessions | Mantenimiento | Todos |

> 💡 **Resultado:** El ambiente **Dev/QA completo** puede operar con **$0.00/mes** usando solo Always Free. Esto es una ventaja competitiva enorme de OCI.

---

## 7. Comparativa: PAYG vs Universal Credits vs Gov

### 7.1 Tabla comparativa para el escenario Recomendado ($735/mes PAYG)

| Modelo | Costo mensual | Costo anual | Ahorro vs PAYG | Compromiso |
|--------|--------------|-------------|----------------|------------|
| **PAYG** | $735 | $8,815 | — | Ninguno |
| **UCM 1 año ($1K/mes)** | $492 | $5,904 | **33%** | $12,000/año |
| **UCM 3 años ($1K/mes)** | $404 | $4,850 | **45%** | $36,000 total |
| **BYOL + PAYG** | $458 | $5,492 | **38%** | Licencias Oracle |
| **BYOL + UCM 1 año** | $307 | $3,680 | **58%** | $12,000/año + Licencias |
| **BYOL + UCM 3 años** | $252 | $3,023 | **66%** | $36,000 total + Licencias |
| **Gov (estimado)** | ~$400-550 | ~$4,800-6,600 | **25-45%** | Contrato gobierno |

### 7.2 Recomendación de Contratación

```
┌─────────────────────────────────────────────────────────────────┐
│                  RUTA DE CONTRATACIÓN RECOMENDADA                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FASE 0 (Mes 1-2): PAYG + Free Trial ($300 créditos)           │
│  ├── Usar $300 free trial para PoC                              │
│  ├── Validar sizing real de DB y compute                        │
│  └── Dev/QA completamente en Always Free                        │
│                                                                  │
│  FASE 1 (Mes 3-6): PAYG                                        │
│  ├── Desplegar Sandbox y Producción                             │
│  ├── Medir consumo real 3 meses                                │
│  └── Costo estimado: ~$500-750/mes                              │
│                                                                  │
│  FASE 2 (Mes 7+): UCM Annual Flex                               │
│  ├── Con datos reales, negociar UCM 1 año                       │
│  ├── Commit basado en consumo real (no estimado)                │
│  ├── Si hay licencias Oracle → aplicar BYOL                    │
│  └── Costo estimado: ~$300-500/mes                              │
│                                                                  │
│  PARALELO: Explorar contrato Gov                                │
│  ├── Contactar Oracle Colombia (representante gobierno)          │
│  ├── Evaluar Colombia Compra Eficiente                          │
│  └── Evaluar Oracle Support Rewards si hay soporte activo       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Optimización de Costos

### 8.1 Top 10 Optimizaciones Ordenadas por Impacto

| # | Optimización | Ahorro estimado/mes | Esfuerzo |
|---|-------------|-------------------:|----------|
| 1 | **UCM Annual Flex** (33% dto) | ~$243 | Bajo (contrato) |
| 2 | **BYOL Autonomous DB** (si hay licencias) | ~$277 | Bajo (verificar licencias) |
| 3 | **Always Free para Dev/QA** | ~$200 | Bajo (configurar) |
| 4 | **ARM compute** (A1 vs E4) | ~$55 | Medio (validar compatibilidad) |
| 5 | **Reducir DB storage** (1TB → 200GB) | ~$95 | Bajo |
| 6 | **Parar Sandbox fuera de horario** | ~$15 | Bajo (script cron) |
| 7 | **Object Storage lifecycle** (auto-archive) | ~$3 | Bajo |
| 8 | **Compartir DB Dev/QA + Sandbox** (schemas) | ~$0 (ya en Free) | Bajo |
| 9 | **Logging: solo prod** (Dev usa console) | ~$5 | Bajo |
| 10 | **OCI Cost Analysis** (revisión mensual) | Variable | Bajo |

### 8.2 Herramientas OCI para Control de Costos

| Herramienta | Función | Costo |
|-------------|---------|-------|
| **OCI Cost Analysis** | Dashboard de costos por compartment, servicio, tag | Gratuito |
| **OCI Budgets** | Alertas cuando el gasto excede umbral | Gratuito |
| **OCI Usage Reports** | CSV detallado de consumo | Gratuito |
| **OCI Cost & Usage API** | Integración programática para reportes | Gratuito |
| **OCI Tagging** | Etiquetar recursos por ambiente/equipo/proyecto | Gratuito |

> **Recomendación:** Configurar **OCI Budgets** con alerta al 80% y 100% del presupuesto mensual desde el día 1.

---

## 9. Roadmap de Gasto por Fase

### 9.1 Timeline de Costos

| Fase | Periodo | Ambientes activos | Modelo | Costo estimado/mes |
|------|---------|-------------------|--------|-------------------:|
| **PoC / Evaluación** | Mes 1-2 | Dev/QA (Free) | Free Trial + PAYG | **$0 - $50** |
| **Desarrollo F1** | Mes 3-5 | Dev/QA (Free) + Sandbox | PAYG | **$200 - $350** |
| **Go-Live F1** | Mes 6 | Dev/QA + Sandbox + Prod | PAYG | **$500 - $750** |
| **Operación estable** | Mes 7-12 | Dev/QA + Sandbox + Prod | **UCM 1 año** | **$350 - $500** |
| **Crecimiento** | Mes 13+ | +CPOs, +data | UCM + scale | **$500 - $800** |

### 9.2 Proyección Anual (Primer año)

| Concepto | Meses | Costo/mes | Total |
|----------|-------|-----------|------:|
| PoC (Free Trial) | 2 | $25 (avg) | $50 |
| Desarrollo | 3 | $275 (avg) | $825 |
| Go-Live | 1 | $625 (avg) | $625 |
| Operación UCM | 6 | $425 (avg) | $2,550 |
| **TOTAL AÑO 1** | **12** | | **$4,050** |

> **Comparación:** El diseño sobredimensionado anterior hubiera costado **$36,000-60,000/año**. La arquitectura simplificada reduce el costo a **~$4,000-9,000/año** — un ahorro del **75-93%**.

---

## 10. Resumen Ejecutivo

### Modelos de contratación disponibles

| Modelo | Mejor para | Descuento |
|--------|-----------|-----------|
| **Pay As You Go** | Inicio, PoC, flexibilidad | 0% |
| **Universal Credits (UCM)** | Producción estable | 33-60% |
| **BYOL** | Si hay licencias Oracle existentes | 50-75% en DB |
| **Always Free** | Dev/QA permanente | 100% |
| **Government Cloud** | Entidad pública + soberanía datos | Negociable |

### Rango de costos mensuales

| Escenario | Costo/mes |
|-----------|-----------|
| **Mínimo absoluto** (Free + ARM + UCM + BYOL) | **~$250-300** |
| **Recomendado** (PAYG estándar) | **~$500-750** |
| **Con UCM** (Annual Flex) | **~$350-500** |
| **Techo** (sin optimizar, PAYG) | **~$750-900** |

### Factores diferenciadores OCI vs otros clouds

| Factor | OCI | AWS/Azure/GCP |
|--------|-----|---------------|
| **Egress data** | 10 TB/mes GRATIS | $0.09/GB (~$900/10TB) |
| **Always Free DB** | 2× Autonomous DB 1 OCPU | No equivalente |
| **Always Free compute** | 4 OCPU ARM + 24 GB | Limitado (t2.micro) |
| **Autonomous DB** | Auto-patch, auto-tune, Data Guard incluido | RDS requiere config manual |
| **BYOL** | Sí, descuento real | AWS: License Included only |
| **Región Colombia** | ✅ Bogotá (BOG) | AWS: No. Azure: No. GCP: No (São Paulo) |
| **Precio compute** | ~40-50% más barato | Referencia |

### Acción inmediata recomendada

1. **Crear cuenta OCI** con Free Trial ($300 créditos, 30 días)
2. **Desplegar Dev/QA** en Always Free (costo $0)
3. **Verificar licencias Oracle** existentes en UPME/MinEnergía (BYOL)
4. **Contactar Oracle Colombia** para explorar contrato gobierno
5. **Medir consumo real** 3 meses antes de comprometerse con UCM
6. **Configurar OCI Budgets** con alertas desde el día 1

---

> **Nota:** Los precios son estimaciones basadas en la lista de precios pública de OCI (Q1 2026, región Americas). Los precios reales pueden variar según negociación, región específica (Bogotá), y promociones vigentes. Se recomienda usar el [OCI Cost Estimator](https://www.oracle.com/cloud/costestimator.html) para un cálculo preciso con configuraciones específicas.

# Seguridad Cloud — Oracle Cloud Infrastructure (OCI)

## Marco de Referencia

| Estándar | Aplicación |
|----------|-----------|
| **CIS Benchmarks for Oracle Cloud** | Baseline de configuración segura |
| **NIST 800-53** | Controles de seguridad para sistemas gubernamentales |
| **ISO 27001/27002** | Sistema de gestión de seguridad de la información |
| **OWASP Top 10** | Vulnerabilidades web más críticas |
| **OWASP API Security Top 10** | Vulnerabilidades específicas de APIs |
| **Ley 1581 de 2012** | Protección de Datos Personales (Colombia) |
| **Estándares MinTIC** | Seguridad para entidades del gobierno colombiano |

---

## Dominios de Expertise OCI

### OCI IAM (Identity and Access Management)

| Componente | Función | Configuración UPME |
|-----------|---------|-------------------|
| **Compartments** | Aislamiento lógico de recursos | `upme-prod`, `upme-staging`, `upme-dev`, `upme-security`, `upme-networking` |
| **Policies** | Control de acceso declarativo | Least privilege, por compartment y servicio |
| **Dynamic Groups** | Permisos para instancias/pods | OKE pods acceden a Vault, Streaming, DB |
| **Instance Principals** | Auth sin credenciales estáticas | Pods OKE autenticados automáticamente |

**Principio:** Ningún recurso tiene más permisos de los estrictamente necesarios.

### OCI Vault

| Característica | Detalle |
|---------------|---------|
| HSM | FIPS 140-2 Level 3 |
| Master Keys | RSA 2048+ para JWT signing, AES-256 para encryption |
| Secrets | DB passwords, API keys, certificados mTLS |
| Rotación | Automática cada 90 días (API keys), anual (master keys) |
| Acceso | Solo via IAM policies + Dynamic Groups |

**Regla absoluta:** NUNCA hardcodear secrets. NUNCA en variables de entorno planas. Siempre OCI Vault.

### OCI WAF (Web Application Firewall)

| Regla | Protección |
|-------|-----------|
| OWASP Top 10 rules | SQLi, XSS, CSRF, path traversal, etc. |
| DDoS L7 | Rate limiting, challenge-response |
| Bot detection | CAPTCHA, JavaScript challenge, fingerprinting |
| GeoIP filtering | Bloqueo por país si necesario |
| Custom rules por CPO | Rate limits específicos, IP whitelisting |
| Request size limits | Max body: 10MB (payloads OCPI) |

### OCI Network Security

| Componente | Función | Configuración |
|-----------|---------|---------------|
| **VCN** | Red virtual aislada | 10.0.0.0/16, subnets por función |
| **NSGs** | Firewalls por recurso | Reglas específicas por servicio |
| **Security Lists** | Firewalls por subnet | Backup a NSGs |
| **Network Firewall** | Deep Packet Inspection | IDS/IPS, SSL inspection |
| **VPN Connect** | Site-to-site con Cárgame | IPSec IKEv2, túneles redundantes |

### OCI Certificates

| Función | Detalle |
|---------|---------|
| TLS automático | Let's Encrypt integration, auto-renewal |
| mTLS para CPOs | Certificados X.509, CA propia UPME |
| Rotación | Sin downtime, certificate staging |
| Revocación | CRL + OCSP responder |

### OCI Bastion

| Función | Detalle |
|---------|---------|
| Acceso a subnets privadas | SSH tunneling seguro |
| Sesiones auditadas | Logs inmutables, duración limitada |
| Aprobación | Manual por admin, expira en 3h |

### OCI Logging/Audit

| Función | Detalle |
|---------|---------|
| Audit logs | Inmutables, todas las operaciones de OCI API |
| Service Connector Hub | Routing de logs a Object Storage, SIEM |
| Retención | Mínimo 1 año (audit), WORM policy |
| SIEM integration | Export a ELK, Splunk, o SIEM UPME |

### OCI Container Security

| Función | Detalle |
|---------|---------|
| OCIR scanning | Vulnerability scanning automático |
| Image signing | Verificación de integridad |
| Admission control | Solo imágenes firmadas en OKE prod |
| Runtime scanning | Detección de anomalías en runtime |

---

## Checklist de Seguridad Cloud

Aplicar a **TODA** propuesta técnica:

```
□ Principio de menor privilegio aplicado (IAM policies)
□ Cifrado en tránsito (TLS 1.3) y en reposo (AES-256)
□ Secrets en OCI Vault — NUNCA hardcodeados, NUNCA en env vars planas
□ Network segmentation: subnets privadas para workloads, públicas solo para LBs
□ WAF habilitado con reglas OWASP Top 10 + custom rules por CPO
□ mTLS verificado entre CPOs y plataforma (CA propia UPME)
□ Rate limiting configurado por tier de CPO
□ Logs inmutables habilitados (Object Storage WORM policy)
□ Vulnerability scanning en pipeline CI (SAST: SonarQube, DAST: OWASP ZAP)
□ Container image scanning en OCIR antes de deployment
□ Rotación automática de API Keys cada 90 días
□ DRP validado con DR Drill (simulacro de failover completo)
□ Cumplimiento Ley 1581/2012 verificado (PII clasificado en Data Catalog)
□ Audit trail completo para supervisión SIC
□ Zero-trust: todo tráfico inter-servicio autenticado (Service Mesh mTLS)
```

---

## Modelo de Compartments OCI

```
tenancy (UPME)
├── upme-security          # Vault, certificates, WAF policies, audit logs
├── upme-networking        # VCN, subnets, VPN, Network Firewall, LB
├── upme-prod              # Producción
│   ├── upme-prod-app      # OKE cluster, pods
│   ├── upme-prod-data     # ATP, Redis, Streaming, Object Storage
│   └── upme-prod-monitor  # Monitoring, Logging Analytics, APM
├── upme-staging           # Pre-producción (espejo de prod)
├── upme-dev               # Desarrollo
└── upme-sandbox           # Sandbox para CPOs
```

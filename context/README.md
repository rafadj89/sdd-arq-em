# Documentación de Contexto — Plataforma de Interoperabilidad UPME

Este directorio contiene la documentación detallada del proyecto, organizada por dominio. El archivo `CLAUDE.md` en la raíz del proyecto contiene el resumen ejecutivo y los punteros a estos documentos.

## Estructura

```
context/
├── architecture/                    # Arquitectura del sistema
│   ├── system-overview.md           # C4, bounded contexts, actores, Structurizr DSL
│   ├── backend.md                   # Patrones backend, Go/Python, DDD, EDA
│   ├── oci-infrastructure.md        # Stack OCI, networking, OKE, DRP, Terraform
│   ├── api-gateway.md               # API Gateway, rutas, contratos, PoC
│   └── data-layer.md                # BD, TimescaleDB, Data Lake, Redis, volumetría
│
├── security/                        # Seguridad integral
│   ├── cloud-oci.md                 # Seguridad OCI (IAM, Vault, WAF, mTLS, containers)
│   ├── on-premise.md                # Seguridad on-prem (VPN, PKI, hardening, SIEM)
│   ├── oauth-keycloak.md            # OAuth 2.1, KeyCloak, flujos, tokens, RBAC
│   └── penetration-testing.md       # PenTest, OWASP, checklists, formato hallazgos
│
├── guidelines/                      # Lineamientos y estándares
│   ├── coding-standards.md          # Calidad de código, testing, logging, errores
│   ├── api-contracts.md             # Contract-first, OpenAPI 3.1, governance
│   ├── observability.md             # 4 capas, dashboards, alerting, SLOs, runbooks
│   ├── data-governance.md           # Gobernanza de datos, calidad, cumplimiento
│   └── legal-regulatory.md          # Resolución 40559, Ley 1581, SIC, cronograma
│
├── scaffoldings/                    # Plantillas de código base
│   ├── backend-go.md                # Scaffolding servicio Go (hexagonal, OTel, Kafka)
│   ├── backend-python.md            # Scaffolding servicio Python (FastAPI, Pydantic)
│   └── frontend-react.md            # Scaffolding React + TypeScript (KeyCloak, shadcn)
│
└── templates/                       # Plantillas de documentos
    ├── adr.md                       # Architecture Decision Record
    ├── evaluation.md                # Evaluación de tecnologías
    └── runbook.md                   # Runbook de alertas operacionales
```

## Convenciones

- **Documentación:** Español
- **Código, comentarios, nombres técnicos:** Inglés
- **Formato:** Markdown con diagramas Mermaid y Structurizr DSL
- **Versionado:** Los documentos se versionan con el repositorio (Git)

## Cómo usar

1. **CLAUDE.md** (raíz) tiene el contexto resumido del proyecto y roles del agente
2. **context/** tiene el detalle — consultar según el dominio de la solicitud
3. **specs/** tiene las especificaciones técnicas del proyecto
4. **entregables/** tiene los documentos oficiales versionados

# Resolución 40559 del 21 de noviembre de 2025 — Contexto, Plazos y Specs Técnicos

## Origen
- **Entidad emisora:** Ministerio de Minas y Energía (MinEnergía), Colombia
- **Número:** Resolución 40559 de 2025
- **Fecha de publicación:** 21 de noviembre de 2025
- **Objeto:** Establecer lineamientos de interoperabilidad para estaciones de carga de vehículos eléctricos de acceso público en Colombia
- **Estándar adoptado:** OCPI 2.2.1 (Open Charge Point Interface)
- **Entidad ejecutora:** UPME (Unidad de Planeación Minero-Energética)

## Actores Regulados
| Actor | Rol | Obligación principal |
|-------|-----|---------------------|
| **UPME** | Administrador de la plataforma | Diseñar, construir y operar la plataforma de interoperabilidad |
| **CPO (Charge Point Operator)** | Operador de puntos de carga | Registrarse, reportar información de estaciones en tiempo real, cumplir OCPI 2.2.1 |
| **MSP (eMobility Service Provider)** | Proveedor de servicios de movilidad | Conectarse a la plataforma para acceder a red de carga |
| **MinEnergía** | Regulador | Supervisión, cumplimiento regulatorio, vigilancia sobre integridad de datos |
| **Cárgame** | Sistema externo de registro | Validación de CPOs registrados y habilitados |
| **SIC** | Superintendencia de Industria y Comercio | Supervisión de protección al consumidor y veracidad de información reportada |
| **Clientes consumidores** | Usuarios finales | Beneficiarios de la interoperabilidad (acceso a cualquier punto de carga) |

## Cronograma de Cumplimiento Técnico — FECHAS EXACTAS

| Hito | Plazo Establecido | Fecha Estimada | Requerimiento Técnico Clave |
|------|-------------------|----------------|---------------------------|
| **Entrada en Vigencia** | Fecha de publicación | **21 de noviembre de 2025** | Inicio de la obligación normativa para nuevos operadores |
| **Puesta a Disposición del Público** | 90 días hábiles desde vigencia | **~Abril de 2026** | Visualización de información, requerimientos y respuestas en tiempo real |
| **Entrega Guía Técnica de Implementación** | ~6 meses desde vigencia | **~Mayo de 2026** | Documento público con requisitos OCPI 2.2.1, protocolos de seguridad, formatos, procedimientos de registro |
| **Estandarización de Cargadores** | Inmediato / Transitorio | Según transitoriedad | Implementación de conectores universales y estándares internacionales |
| **Reporte de Información en Tiempo Real** | Permanente tras 90 días | **Abril 2026 en adelante** | API/sistema de reporte de precios, disponibilidad y estado de carga |
| **Ambiente Sandbox disponible** | Post-guía | **~Agosto 2026** | Ambiente de pruebas para CPOs |
| **Ambiente Producción operativo** | Post-sandbox | **~Noviembre 2026** | Plataforma en producción con DRP activo |
| **Pruebas y Certificación CPOs** | Post-producción | **Nov 2026 - May 2027** | Certificación obligatoria de cada CPO |
| **Operación plena** | ~18 meses desde vigencia | **~Mayo 2027** | Todos los CPOs integrados y reportando |

### Línea de Tiempo Real (con fechas calendario):
```
Nov 2025     Feb 2026      Abr 2026      May 2026       Ago 2026      Nov 2026      May 2027
  │             │              │              │              │              │              │
  ▼             ▼              ▼              ▼              ▼              ▼              ▼
Resolución   Inicio       90 días       Guía Técnica   Sandbox        Producción    Operación
Publicada    Construcción  Información   Entregada      Disponible     Go-Live       Plena
             Guía          Pública                                                    
```

### Fase actual del proyecto (Febrero 2026):
- **Estamos en:** Construcción de la Guía Técnica de Implementación
- **Próximo hito regulatorio:** Puesta a disposición del público (~Abril 2026)
- **Entrega de guía:** ~Mayo 2026
- **Post-guía:** Inicio del desarrollo de la plataforma

### Implicaciones críticas:
1. La **Guía Técnica** requiere tener definidas ANTES de su publicación:
   - Arquitectura de software completa
   - Protocolos de comunicación OCPI 2.2.1
   - Protocolos de autenticación y seguridad (KeyCloak, mTLS, OAuth2, API Keys)
   - Diagramas de secuencia de cada flujo
   - Especificaciones de rate limiting y SLA
   - Procedimientos de registro y certificación de CPOs
2. La **información pública** (precios, disponibilidad, ubicación) debe estar disponible a Abril 2026
3. El sistema debe estar listo para supervisión de la **SIC** en protección al consumidor
4. Los tiempos son **mandatorios** — no hay margen sin modificación de la resolución

## Especificaciones Técnicas para la Arquitectura (Specs de la Resolución)

### 1. Interoperabilidad
- El sistema debe permitir que cualquier usuario cargue su vehículo independientemente de la red del operador
- Protocolo estándar de comunicación: **OCPI 2.2.1**
- Cualquier CPO habilitado debe poder conectarse mediante APIs estandarizadas

### 2. Transparencia de Datos (Módulo de Consulta Pública)
- Desarrollo de módulo de consulta pública que muestre en **tiempo real**:
  - **Precios** de carga por estación/conector
  - **Disponibilidad** de conectores (Available, Charging, OutOfOrder, etc.)
  - **Ubicación** georreferenciada de estaciones
- Este módulo debe estar disponible a los **90 días hábiles** (~Abril 2026)
- Formato: API Open Data + Portal web público

### 3. Seguridad y Monitoreo
- La **UPME** y el **Ministerio** ejercerán vigilancia sobre la integridad de los datos cargados
- La **SIC** supervisará la protección del consumidor y veracidad de la información
- Requerimientos técnicos:
  - Auditoría completa de todas las transacciones
  - Trazabilidad end-to-end de cada dato reportado
  - Detección de inconsistencias o manipulación de datos
  - Cifrado TLS 1.2+ para todas las comunicaciones
  - Autenticación mutua (mTLS) para CPOs
  - API Keys únicas por operador
  - Rate limiting para prevenir abuso
  - WAF para protección contra ataques web
  - Cumplimiento Ley 1581 de 2012 (Protección de Datos Personales)

### 4. Cumplimiento de Estándares
- Adaptación técnica a los estándares internacionales de carga eléctrica adoptados por Colombia
- Implementación de conectores universales
- Estándares de referencia: IEC 61851 (carga conductiva), IEC 62196 (conectores)

## Módulos OCPI 2.2.1 Requeridos

### Módulos obligatorios:
1. **Locations** — Información de ubicación de puntos de carga
2. **EVSEs** — Estado y disponibilidad de conectores
3. **Tariffs** — Tarifas de carga
4. **Sessions** — Sesiones de carga activas
5. **CDRs (Charge Detail Records)** — Registros detallados de carga completada
6. **Tokens** — Autenticación de usuarios
7. **Commands** — Comandos remotos (start/stop charging)

### Datos mínimos por estación (reporte en tiempo real):
- Identificador único de estación
- Geolocalización (lat/lon)
- Estado de cada conector (Available, Charging, OutOfOrder, etc.)
- Potencia entregada (kW)
- Tipo de conector (Type 1, Type 2, CCS, CHAdeMO)
- Tarifa vigente
- Precio por kWh
- Disponibilidad (libre/ocupado)

## Arquitectura de Autenticación y Seguridad

### Servidor de Autenticación: KeyCloak
- **Componente central:** KeyCloak como Identity Provider (IdP) y Authorization Server
- **Funciones:**
  - Gestión de identidades de CPOs, MSPs, administradores UPME
  - Emisión de tokens JWT (access_token + refresh_token)
  - Gestión de roles y permisos (RBAC)
  - Soporte multi-realm: UPME_Internal, CPO_External, Public_API
  - Integración con LDAP/AD de UPME para usuarios internos
  - Federación de identidades para CPOs corporativos (SAML/OIDC)
- **Despliegue:** Cluster HA sobre OKE (mínimo 2 réplicas)
- **Base de datos:** PostgreSQL dedicada (o Autonomous DB)
- **PoC requerido antes de guía:** Validar flujos OAuth2 completos con CPO piloto

### Flujo de Autenticación CPO (Diagrama de Secuencia):
```
CPO                    KeyCloak              API Gateway           Microservicio
 │                        │                      │                      │
 │──POST /token──────────>│                      │                      │
 │  (client_id + secret)  │                      │                      │
 │<───JWT + refresh───────│                      │                      │
 │                        │                      │                      │
 │──PUT /locations────────────────────────────>│                      │
 │  (Bearer JWT + mTLS)   │                      │                      │
 │                        │──Validate JWT───────>│                      │
 │                        │<──Valid + scopes──── │                      │
 │                        │                      │──Forward request────>│
 │                        │                      │<──Response───────── │
 │<──────────200 OK──────────────────────────── │                      │
```

### API Keys por CPO — Diseño:
- **Generación:** Al completar registro + certificación en Sandbox
- **Formato:** UUID v4 + prefijo identificador (`upme_cpo_xxxx`)
- **Almacenamiento:** Hash SHA-256 en base de datos, texto plano solo en momento de generación
- **Rotación:** Cada 90 días (automática con notificación 30 días antes)
- **Revocación:** Inmediata si CPO es dado de baja en Cárgame
- **Scopes por API Key:**
  - `locations:write` — Reportar información de estaciones
  - `locations:read` — Consultar estaciones propias
  - `sessions:write` — Reportar sesiones de carga
  - `cdrs:write` — Reportar registros detallados
  - `admin:read` — Consultar estado de cuenta y métricas

### Protocolos de Comunicación:
| Protocolo | Uso | Detalle |
|-----------|-----|---------|
| **HTTPS/TLS 1.3** | Todas las comunicaciones | Cifrado en tránsito obligatorio |
| **mTLS** | CPO ↔ Plataforma | Certificados X.509 mutuos, CA propia UPME |
| **OAuth 2.0 (Client Credentials)** | Autenticación de CPOs | KeyCloak como Authorization Server |
| **JWT (RS256)** | Tokens de acceso | Firmados con clave RSA, verificados en API Gateway |
| **WebSocket (WSS)** | Notificaciones real-time | Push de cambios de estado a CPOs suscritos |
| **VPN IPSec IKEv2** | Integración Cárgame | Túneles redundantes activo/activo |

## Supervisión SIC
El sistema debe estar preparado para:
- **Auditorías de la SIC** sobre protección al consumidor
- **Verificación de veracidad** de información reportada por CPOs
- **Logs inmutables** de todas las transacciones (Object Storage con WORM)
- **Reportes exportables** para la SIC en formato estándar
- **Detección de anomalías** en datos reportados (precios inconsistentes, disponibilidad falsa)
- **Canal de quejas/reclamos** del consumidor integrado con la plataforma

## Stakeholders del Proyecto
1. **Dirección UPME** — Sponsor ejecutivo
2. **Subdirección de Energía Eléctrica** — Área funcional
3. **Oficina TI UPME** — Soporte tecnológico
4. **MinEnergía** — Supervisión regulatoria, vigilancia datos
5. **SIC** — Superintendencia de Industria y Comercio (protección consumidor, veracidad datos)
6. **CPOs principales** — Enel X, Celsia, Terpel, otros
7. **Cárgame** — Sistema de registro externo
8. **CREG** — Comisión de Regulación de Energía y Gas
9. **Entidad externa de referencia** — Experto red eléctrica España (Guía SGV)

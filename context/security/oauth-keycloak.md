# Autenticación OAuth 2.1 con KeyCloak

## ¿Por qué OAuth 2.1 y no OAuth 2.0?

OAuth 2.1 (RFC en progreso, basado en OAuth 2.0 Security Best Current Practice - RFC 9700) consolida mejores prácticas obligatorias:

| Mejora | Detalle |
|--------|---------|
| **PKCE obligatorio** | Para TODOS los flujos (no solo públicos) — elimina interceptación de authorization code |
| **Elimina Implicit Grant** | Vulnerabilidades de token en URL fragment |
| **Elimina ROPC** | Resource Owner Password Credentials — flujo inseguro deprecado |
| **Exact string matching** | redirect URIs sin wildcards |
| **Refresh tokens** | Sender-constrained o de uso único |
| **DPoP recomendado** | Demonstrating Proof-of-Possession para tokens de alta criticidad |

---

## Configuración KeyCloak

### Realms

| Realm | Usuarios | Propósito |
|-------|---------|-----------|
| `upme-internal` | Usuarios internos UPME | LDAP/AD federation, MFA obligatorio |
| `upme-cpo` | CPOs y MSPs | Registro externo, client credentials, mTLS |
| `upme-public` | Portal público | Anonymous + registro opcional |

### Clients por Tipo de Consumidor

| Client | Grant Type | Seguridad | Scope |
|--------|-----------|-----------|-------|
| **CPO Machine-to-Machine** | `client_credentials` | + PKCE + mTLS (Certificate-Bound - RFC 8705) | `cpo:write`, `cpo:read` |
| **Portal Admin SPA** | `authorization_code` | + PKCE + DPoP + refresh token rotation | `admin:full`, `admin:read` |
| **Portal Público** | `authorization_code` | + PKCE (scopes limitados) | `public:read` |
| **Service-to-Service** | `client_credentials` | + audience restriction | Interno |

### Token Policies

| Parámetro | CPO M2M | Portal Admin | Portal Público |
|-----------|---------|-------------|----------------|
| Access Token TTL | 5 min | 15 min | 30 min |
| Refresh Token TTL | N/A (re-auth) | 8h | 4h |
| Refresh Rotation | N/A | Activada + reuse detection | Activada |
| Token Format | JWT RS256 | JWT RS256 | JWT RS256 |
| Signing Key | RSA 2048+ en OCI Vault | RSA 2048+ en OCI Vault | RSA 2048+ en OCI Vault |
| Key Rotation | Anual | Anual | Anual |

### Roles y Permisos (RBAC)

| Rol | Descripción | Asignado a |
|-----|------------|------------|
| `cpo:write` | Reportar datos OCPI (Locations, Sessions, CDRs) | CPOs certificados |
| `cpo:read` | Consultar datos propios | CPOs |
| `admin:full` | Administración completa de la plataforma | Admin UPME |
| `admin:read` | Dashboards y reportes | Equipo UPME |
| `public:read` | Consulta pública (precios, disponibilidad) | Ciudadanos |
| `sic:audit` | Acceso de auditoría SIC (read-only, todos los CPOs) | SIC |
| `cargame:validate` | Validación de CPOs contra Cárgame | Sistema (interno) |

### Federación e Integración

| Tipo | Detalle |
|------|---------|
| **LDAP/AD** | User Federation para usuarios internos UPME |
| **SAML 2.0/OIDC** | CPOs corporativos con IdP propio |
| **Custom SPI** | Validación automática contra Cárgame en registro |

### Alta Disponibilidad

| Componente | Configuración |
|-----------|---------------|
| Cluster | Mínimo 2 réplicas en OKE, HPA configurado |
| Base de datos | PostgreSQL dedicada con Data Guard |
| Sesiones | Infinispan distributed cache |
| Health checks | Readiness + liveness probes |

---

## Flujos de Autenticación

### Flujo 1: Client Credentials + mTLS (CPO → Plataforma)

```mermaid
sequenceDiagram
    participant CPO as CPO (Machine)
    participant KC as KeyCloak
    participant GW as API Gateway
    participant MS as Microservicio

    CPO->>KC: POST /realms/upme-cpo/protocol/openid-connect/token
    Note right of CPO: grant_type=client_credentials<br/>client_id + client_secret<br/>+ mTLS cert (RFC 8705)<br/>+ PKCE code_verifier
    KC->>KC: Valida credenciales + certificado X.509
    KC->>KC: Genera JWT con cnf.x5t#S256 (cert-bound)
    KC-->>CPO: 200 {access_token (JWT), token_type: "DPoP"}
    CPO->>GW: PUT /ocpi/2.2.1/locations
    Note right of CPO: Authorization: DPoP <jwt><br/>DPoP: <proof><br/>X-Client-Cert: <cert>
    GW->>GW: Verifica JWT signature (RS256)
    GW->>GW: Verifica DPoP proof binding
    GW->>GW: Verifica cert binding (cnf claim)
    GW->>GW: Verifica scopes: cpo:write
    GW->>GW: Rate limit check (tier CPO)
    GW->>MS: Forward + X-CPO-ID + X-Correlation-ID
    MS-->>GW: 202 Accepted
    GW-->>CPO: 202 Accepted
```

### Flujo 2: Authorization Code + PKCE + DPoP (Portal Admin)

```mermaid
sequenceDiagram
    participant User as Admin UPME
    participant SPA as Portal (React SPA)
    participant KC as KeyCloak
    participant API as API Backend

    User->>SPA: Accede a /dashboard
    SPA->>SPA: Genera code_verifier + code_challenge (S256)
    SPA->>KC: GET /auth?response_type=code&code_challenge=...&scope=admin:read
    KC->>User: Login form (+ MFA si configurado)
    User->>KC: Credenciales + OTP
    KC-->>SPA: 302 redirect con authorization_code
    SPA->>KC: POST /token (code + code_verifier + DPoP proof)
    KC-->>SPA: {access_token, refresh_token, id_token}
    SPA->>API: GET /api/dashboard (DPoP token + DPoP proof)
    API->>API: Valida JWT + DPoP + scopes
    API-->>SPA: 200 Dashboard data
```

---

## Vulnerabilidades y Mitigaciones

| Ataque | Mitigación | Verificación (PenTest) |
|--------|------------|----------------------|
| Token theft/replay | DPoP + Certificate-Bound tokens | Replay token desde otra máquina |
| Authorization code interception | PKCE S256 obligatorio | Interceptar code sin verifier |
| JWT algorithm confusion (alg:none) | Validar alg=RS256 explícitamente en GW | Enviar JWT con alg:none |
| Refresh token theft | Rotation + reuse detection → revoca familia completa | Usar refresh token dos veces |
| Client impersonation | mTLS + client_secret + PKCE | Usar credenciales sin cert |
| Scope escalation | Validar scopes en API Gateway Y en microservicio | Modificar scopes en JWT |
| Open redirect | Exact match redirect_uri (no wildcards) | Redirect a dominio externo |

---

## Checklist de Autenticación

Aplicar a **TODA** propuesta que involucre auth:

```
□ OAuth 2.1 compliance verificado (no Implicit, no ROPC, PKCE obligatorio)
□ Tokens son sender-constrained (DPoP o Certificate-Bound)
□ Access Token TTL mínimo viable (5-30 min según caso)
□ Refresh Token con rotación y reuse detection activada
□ JWT firmado con RS256 (clave RSA en OCI Vault, rotación anual)
□ Claims mínimos en JWT (sub, iss, aud, exp, iat, scope, cnf)
□ Audience restriction configurada (aud = API específica)
□ mTLS certificado X.509 verificado para CPOs (CA propia UPME)
□ Revocación de tokens funcional (endpoint /revoke + propagación < 30s)
□ CORS restrictivo en KeyCloak (solo origins conocidos)
□ Brute force protection activada en KeyCloak (lockout tras 5 intentos)
□ Session idle timeout configurado (15 min admin, 30 min público)
□ Logout completo implementado (front-channel + back-channel + token revocation)
□ Logs de autenticación inmutables para auditoría SIC
□ PoC validado con CPO piloto antes de producción
```

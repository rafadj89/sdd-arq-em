# Penetration Testing y Seguridad de Aplicaciones

## Marco de Referencia

| Estándar | Aplicación |
|----------|-----------|
| **OWASP Testing Guide v4.2** | Metodología de testing de aplicaciones web |
| **OWASP API Security Top 10 (2023)** | Vulnerabilidades específicas de APIs |
| **PTES** | Penetration Testing Execution Standard |
| **NIST SP 800-115** | Technical Guide to Information Security Testing |

---

## Checklist de PenTest Pre-Deployment

Aplicar a **CADA** feature/release:

### 1. Autenticación y Autorización

```
□ Bypass de autenticación probado (token manipulation, replay attacks)
□ Escalación de privilegios horizontal (CPO A accediendo datos de CPO B)
□ Escalación de privilegios vertical (CPO accediendo endpoints admin)
□ JWT manipulation: cambio de claims, firma con alg:none, key confusion
□ mTLS bypass: certificado revocado, expirado, de otro CPO
□ API Key: uso de key revocada, brute force, timing attacks en validación
□ OAuth2: redirect URI manipulation, CSRF en flujo de autorización
□ Session fixation/hijacking en portal web
```

### 2. Inyección y Validación de Entrada

```
□ SQL Injection en todos los endpoints con parámetros (parameterized queries verificado)
□ NoSQL Injection (si aplica)
□ Command Injection (si hay ejecución de comandos del sistema)
□ SSRF (Server-Side Request Forgery) — especialmente en integraciones con Cárgame
□ XXE (XML External Entity) si se procesan XMLs
□ Path Traversal en uploads/downloads
□ JSON Schema validation bypass en payloads OCPI
```

### 3. APIs

```
□ BOLA (Broken Object Level Authorization) — /locations/{id} con ID de otro CPO
□ BFLA (Broken Function Level Authorization) — CPO accediendo /admin/*
□ Mass Assignment — campos no esperados en payloads
□ Rate limiting bypass (header manipulation, IP rotation)
□ Excessive data exposure — respuestas con más datos de los necesarios
□ Improper inventory management — endpoints no documentados expuestos
```

### 4. Infraestructura

```
□ Port scanning en servicios expuestos
□ TLS configuration (SSL Labs A+ rating, no TLS 1.0/1.1, no cipher suites débiles)
□ HTTP security headers (HSTS, CSP, X-Frame-Options, etc.)
□ CORS configuration (origins restrictivos, no wildcard)
□ DNS rebinding prevention
□ Container escape attempts (si OKE)
```

### 5. Datos y Privacidad

```
□ PII exposure en logs, error messages, responses
□ Datos de un CPO NO accesibles por otro CPO
□ Datos eliminados realmente eliminados (o marcados según política)
□ Cumplimiento Ley 1581/2012 verificado
```

### 6. Disponibilidad

```
□ DDoS L7 resilience (WAF rules effectiveness)
□ Resource exhaustion (payloads oversized, connection flooding)
□ Slowloris/slow-read attacks
□ Circuit breaker effectiveness (Cárgame unavailable simulation)
```

---

## Formato de Reporte de Hallazgo

```markdown
## HALLAZGO: [Título descriptivo]

- **Severidad:** Crítica | Alta | Media | Baja | Informativa
- **CVSS v3.1:** [Score numérico]
- **CWE:** [CWE-ID y nombre]
- **Ubicación:** [Endpoint/Componente/Línea de código]
- **Fecha de descubrimiento:** [YYYY-MM-DD]
- **Estado:** Abierto | En remediación | Cerrado | Aceptado (risk acceptance)

### Descripción
[Qué encontramos — descripción técnica clara]

### Evidencia
[Pasos exactos para reproducir, incluyendo requests/responses]

### Impacto
[Qué podría hacer un atacante — escenario de ataque realista]

### Remediación
[Cómo arreglarlo, con código de ejemplo si aplica]

### Cumplimiento Afectado
- **Resolución 40559:** [Impacto específico]
- **Ley 1581/2012:** [Impacto en datos personales]
- **SIC:** [Impacto en auditoría/supervisión]

### Verificación
[Cómo verificar que la remediación fue efectiva]
```

---

## Clasificación de Severidad

| Severidad | CVSS | Ejemplo UPME | SLA Remediación |
|-----------|------|-------------|-----------------|
| **Crítica** | 9.0-10.0 | RCE, bypass total de auth, acceso a todos los datos | 24 horas |
| **Alta** | 7.0-8.9 | SQLi, escalación de privilegios, SSRF a red interna | 7 días |
| **Media** | 4.0-6.9 | XSS almacenado, BOLA parcial, info disclosure | 30 días |
| **Baja** | 0.1-3.9 | Headers faltantes, versiones expuestas, verbose errors | 90 días |
| **Informativa** | 0.0 | Best practice no seguida, mejora recomendada | Backlog |

---

## Calendario de Testing

| Tipo de Test | Frecuencia | Responsable | Alcance |
|-------------|-----------|-------------|---------|
| SAST (SonarQube) | Cada commit (CI) | Automático | Todo código |
| DAST (OWASP ZAP) | Cada release a staging | Automático | APIs expuestas |
| PenTest manual | Pre-release a producción | Seguridad IT | Feature nueva + regresión |
| PenTest externo | Anual | Firma externa certificada | Plataforma completa |
| Red Team | Semestral | Equipo especializado | Escenarios de ataque realistas |
| Bug Bounty | Continuo (post-Go-Live) | Comunidad | Plataforma pública |

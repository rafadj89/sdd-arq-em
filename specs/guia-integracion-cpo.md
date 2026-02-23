# Guía de Integración CPO — Plataforma de Interoperabilidad UPME

## 1. Proceso de Registro e Integración

### 1.1 Registro en Cárgame (Pre-requisito)
Antes de conectarse a la plataforma UPME, todo CPO debe estar registrado y habilitado en el sistema **Cárgame**.

| Paso | Acción | Responsable | Resultado |
|------|--------|-------------|-----------|
| 1 | Registro de empresa como CPO en Cárgame | CPO | NIT registrado en sistema Cárgame |
| 2 | Validación documental y regulatoria | Cárgame / MinEnergía | Estado: `ACTIVE` o `REJECTED` |
| 3 | Habilitación como operador | Cárgame | CPO apto para solicitar acceso a plataforma UPME |

### 1.2 Onboarding en Plataforma UPME

| Paso | Acción | Detalle |
|------|--------|---------|
| 1 | **Solicitud de acceso** | CPO accede a `developer.upme.gov.co` y solicita registro |
| 2 | **Validación automática vs Cárgame** | Plataforma consulta `GET /api/v1/cpo/{nit}/status` vía VPN. Si `registered: true` y `status: ACTIVE`, se permite continuar |
| 3 | **Generación de credenciales** | Se genera: API Key única, Client Certificate (mTLS), credenciales OAuth2 |
| 4 | **Acceso a Sandbox** | CPO recibe acceso al ambiente Sandbox para pruebas |
| 5 | **Ejecución de suite de compliance** | CPO ejecuta batería de pruebas OCPI 2.2.1 en Sandbox |
| 6 | **Certificación** | Si todas las pruebas pasan → Certificación digital emitida |
| 7 | **Promoción a Producción** | Credenciales de producción entregadas, CPO comienza a reportar |

### 1.3 Baja de un CPO (Deshabilitación)
Cuando un CPO es dado de baja por incumplimiento normativo o regulatorio:

| Evento | Comportamiento de la plataforma |
|--------|-------------------------------|
| Cárgame cambia status a `INACTIVE` o `SUSPENDED` | Validación periódica (cada 24h) detecta cambio de estado |
| Detección de baja | Se revoca API Key y certificados mTLS del CPO |
| Tráfico entrante del CPO | Rechazado con HTTP 403 + mensaje descriptivo |
| Datos históricos | Se mantienen para auditoría pero se marcan como `CPO_SUSPENDED` |
| Notificación | Email automático al CPO con razón y proceso de apelación |
| Reactivación | Si Cárgame reactiva al CPO, debe repetir proceso de certificación en Sandbox |

## 2. Capa de Seguridad

### 2.1 Autenticación Multi-capa

```
CPO Request → WAF → IP Whitelist → mTLS → JWT → API Gateway → Microservicio
```

| Capa | Tecnología | Detalle |
|------|-----------|---------|
| **WAF** | OCI WAF / On-Prem WAF | Protección OWASP Top 10, DDoS L7, bot detection |
| **IP Whitelist** | Security Lists / NSGs | IPs públicas registradas por cada CPO (ver sección 2.2) |
| **mTLS** | Certificados X.509 | Autenticación mutua — cada CPO tiene certificado único |
| **JWT/OAuth2** | OAuth 2.0 + JWT | Token Bearer con scopes por módulo OCPI |
| **API Gateway** | OCI API GW / Kong | Rate limiting, routing, transformación |

### 2.2 Filtrado por IP Pública

> **Decisión pendiente:** Implementar filtrado por IP pública de cada CPO/estación.
> 
> **Pros:**
> - Máxima seguridad — solo IPs conocidas pueden llegar a la plataforma
> - Defensa en profundidad adicional
> - Auditoría clara de origen de tráfico
> 
> **Contras (punto de fricción):**
> - CPOs con IPs dinámicas necesitarían VPN o IP fija
> - Gestión operativa de whitelist (agregar/remover IPs)
> - Puede dificultar onboarding de CPOs pequeños
> 
> **Recomendación:** Implementar como **opcional en Fase 1** (mTLS + JWT es suficiente), 
> y como **obligatorio en Fase 2** con un período de gracia de 90 días para CPOs existentes.
> Ofrecer un servicio de VPN Connect para CPOs que no puedan garantizar IP fija.

### 2.3 Registro de IPs por CPO

Cada CPO debe registrar:
- **IPs de producción:** Máximo 10 IPs públicas (CIDR /32 o /28)
- **IPs de Sandbox:** Sin restricción de IP (para facilitar pruebas)
- **Proceso de actualización:** Solicitud vía portal → aprobación automática en 24h (Sandbox) o manual (Producción)

## 3. Rate Limiting

### 3.1 Políticas por Defecto

| Recurso | Límite | Ventana | Comportamiento al exceder |
|---------|--------|---------|--------------------------|
| **Ingesta de reportes** (`PUT /locations`) | 120 req/min por CPO | Rolling window 1 min | HTTP 429 + header `Retry-After` |
| **Consultas** (`GET /locations`, `GET /sessions`) | 300 req/min por CPO | Rolling window 1 min | HTTP 429 |
| **Autenticación** (`POST /token`) | 10 req/min por CPO | Rolling window 1 min | HTTP 429 + alerta de seguridad |
| **Webhooks** (callbacks de la plataforma) | 60 req/min por endpoint | Rolling window 1 min | Encolamiento con retry exponencial |
| **Global por CPO** | 1,000 req/min total | Rolling window 1 min | HTTP 429 en todas las APIs |

### 3.2 Tiers por Tamaño de CPO

| Tier | Estaciones | Rate Limit Global | Burst Allowance |
|------|-----------|-------------------|-----------------|
| **Pequeño** | 1-20 estaciones | 500 req/min | 2x por 30s |
| **Mediano** | 21-100 estaciones | 1,000 req/min | 2x por 30s |
| **Grande** | 101-500 estaciones | 2,500 req/min | 3x por 30s |
| **Enterprise** | 500+ estaciones | 5,000 req/min | 3x por 60s |

### 3.3 Headers de Rate Limit en Respuesta

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1735689600
X-RateLimit-Policy: "1000;w=60"
```

### 3.4 Comportamiento en Exceso Sostenido
- **1er exceso:** HTTP 429 + log de warning
- **3 excesos en 5 min:** Alerta a equipo de operaciones
- **10 excesos en 1 hora:** Throttle reducido al 50% del límite por 1 hora
- **Exceso sostenido > 24h:** Revisión manual + contacto con CPO

## 4. SLA de la Plataforma

### 4.1 Disponibilidad

| Componente | SLA | Medición |
|-----------|-----|---------|
| **API de Ingesta** | 99.9% | Uptime mensual |
| **API de Consulta** | 99.9% | Uptime mensual |
| **Portal de Desarrolladores** | 99.5% | Uptime mensual |
| **Sandbox** | 99.0% | Uptime mensual (ventanas de mantenimiento permitidas) |

### 4.2 Latencia

| Operación | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| Ingesta de reporte | < 100ms | < 300ms | < 500ms |
| Consulta de estación | < 50ms | < 150ms | < 300ms |
| Validación vs Cárgame | < 200ms | < 500ms | < 1s (con caché miss) |

### 4.3 Integración con Cárgame — SLA Esperado

| Métrica | Valor | Nota |
|---------|-------|------|
| Disponibilidad VPN | 99.9% | Túneles redundantes activo/activo |
| Latencia API Cárgame | < 300ms P95 | Caché Redis con TTL 24h para reducir llamadas |
| Fallback si Cárgame no disponible | Caché local | Si CPO fue validado en últimas 24h, se permite tráfico |
| Timeout | 3 segundos | Circuit breaker abre después de 5 fallos consecutivos |

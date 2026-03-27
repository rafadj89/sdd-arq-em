# Marco Legal y Regulatorio

## Regulación Principal

### Resolución 40559 del 21 de noviembre de 2025

| Campo | Detalle |
|-------|---------|
| **Emisor** | Ministerio de Minas y Energía (MinEnergía) |
| **Objeto** | Condiciones para la interoperabilidad de estaciones de carga de vehículos eléctricos de acceso público |
| **Estándar adoptado** | OCPI 2.2.1 (Open Charge Point Interface) |
| **Entidad ejecutora** | UPME (Unidad de Planeación Minero-Energética) |
| **Supervisión** | MinEnergía (integridad), SIC (protección consumidor) |

### Cronograma Regulatorio (MANDATORIO)

| Hito | Fecha | Estado |
|------|-------|--------|
| Entrada en vigencia | 21 Nov 2025 | Completado |
| Inicio construcción Guía Técnica | Feb 2026 | **FASE ACTUAL** |
| Info pública en tiempo real (90 días hábiles) | ~Abr 2026 | Pendiente |
| Entrega Guía Técnica de Implementación | ~May 2026 | Pendiente |
| Sandbox disponible para CPOs | ~Ago 2026 | Pendiente |
| Producción Go-Live | ~Nov 2026 | Pendiente |
| Certificación CPOs + Operación plena | Nov 2026 → May 2027 | Pendiente |

**ALERTA:** Todo retraso en estos plazos tiene consecuencias regulatorias. Las propuestas técnicas deben considerar este cronograma como restricción inamovible.

---

## Estándar OCPI 2.2.1

### Módulos Obligatorios

| Módulo | Descripción | Datos Clave |
|--------|------------|-------------|
| **Locations** | Ubicación y descripción de estaciones | Coordenadas, dirección, horarios, fotos |
| **EVSEs** | Puntos de carga dentro de estaciones | Estado, conectores, potencia |
| **Tariffs** | Estructura de precios | Precio/kWh, precio/minuto, componentes |
| **Sessions** | Sesiones de carga activas | Inicio, fin, energía, EVSE, CPO |
| **CDRs** | Registros de carga completados | Detalle de costos, energía total, duración |
| **Tokens** | Identificadores de usuarios/vehículos | Tipo, validez, whitelist |
| **Commands** | Comandos remotos | StartSession, StopSession, ReserveNow |

### Requisitos Técnicos OCPI 2.2.1

| Requisito | Detalle |
|-----------|---------|
| Transporte | HTTPS obligatorio (TLS 1.2+, recomendado 1.3) |
| Autenticación | Token-based (OCPI tokens) + extensión con OAuth 2.1 |
| Formato | JSON |
| Encoding | UTF-8 |
| Versionado | /ocpi/2.2.1/ en URL |
| Paginación | Link headers (RFC 5988) |
| Timestamps | ISO 8601 con timezone |

---

## Ley 1581 de 2012 — Protección de Datos Personales

### Aplicación en el Proyecto

| Principio | Implementación |
|-----------|---------------|
| **Legalidad** | Tratamiento autorizado por resolución y consentimiento CPO |
| **Finalidad** | Datos usados exclusivamente para interoperabilidad y supervisión regulatoria |
| **Libertad** | CPO puede consultar, corregir y solicitar eliminación de datos propios |
| **Veracidad** | Validación OCPI garantiza calidad; anomalías detectadas y corregidas |
| **Transparencia** | Política de tratamiento publicada; CPO sabe qué datos se recopilan |
| **Acceso y circulación restringida** | Datos de CPO solo accesibles por el CPO, UPME admin, y SIC (auditoría) |
| **Seguridad** | Cifrado, mTLS, acceso por roles, audit trail |
| **Confidencialidad** | NDA con CPOs, datos comerciales clasificados como Confidencial |

### Datos Personales Identificados

| Dato | Clasificación | Ubicación | Protección |
|------|--------------|-----------|-----------|
| Nombre contacto CPO | PII | ATP, KeyCloak | Cifrado + enmascaramiento en logs |
| Email contacto CPO | PII | ATP, KeyCloak | Cifrado + no en logs |
| Dirección sede CPO | Comercial | ATP, Data Lake | Acceso restringido |
| Datos de usuarios finales | **NO aplica** | No se recopilan | N/A — la plataforma no maneja datos de conductores |

---

## Supervisión SIC

### Requisitos de Auditoría

| Requisito | Implementación |
|-----------|---------------|
| **Audit trail inmutable** | Logs WORM en Object Storage, retención 5 años |
| **Trazabilidad por CPO** | Correlation ID en toda transacción, filtrable por CPO |
| **Veracidad de datos** | Anomaly detection, cross-validation, quality scores |
| **Acceso de auditoría** | Rol `sic:audit` con acceso read-only a todos los datos |
| **Reportes bajo demanda** | Datos Gold listos para extracción en JSON, CSV, PDF |
| **Independencia** | Datos de auditoría separados de datos operacionales |

### Escenarios de Auditoría SIC

| Escenario | Datos Requeridos | Fuente |
|-----------|-----------------|--------|
| "¿CPO X reportó datos falsos de disponibilidad?" | Logs de ingesta, datos Bronze (raw), comparación con Sessions | Bronze + Silver |
| "¿Los precios publicados coinciden con los reportados?" | Tariffs reportados vs API Open Data | Gold + API logs |
| "¿Cuántas anomalías tuvo CPO Y en el último trimestre?" | Anomaly detection logs, quality scores | Silver + monitoring |
| "¿El dato público está actualizado?" | Data freshness metrics, última actualización por estación | Monitoring + Gold |

---

## Verificación Legal — Checklist

Para **CADA** propuesta técnica:

```
□ ¿La feature es requerida por la Resolución 40559?
□ ¿Cumple con los plazos mandatorios? (90 días info pública, 6 meses guía, etc.)
□ ¿Maneja PII? → Verificar Ley 1581/2012
□ ¿Los datos son auditables por la SIC?
□ ¿Hay implicación legal en caso de falla? (CPO dado de baja erróneamente, dato falso publicado)
□ ¿El SLA propuesto es contractualmente defendible?
□ ¿Se requiere aprobación de Legal antes de implementar?
□ ¿El cambio afecta la Guía Técnica de Implementación?
□ ¿Hay impacto en CPOs ya certificados? → Notificación con mínimo 30 días
```

---

## SLAs Contractuales con CPOs

| Métrica | SLA | Penalidad si incumple |
|---------|-----|----------------------|
| Disponibilidad plataforma UPME | 99.9% mensual | Extensión plazo certificación |
| Latencia de ingesta | P99 < 500ms | N/A (best effort) |
| Disponibilidad sandbox | 99.5% mensual | Extensión plazo testing |
| Freshness datos públicos | < 60s | Reporte a MinEnergía |
| Soporte técnico | Respuesta < 4h (hábiles) | Escalación interna |

### Obligaciones del CPO

| Obligación | Verificación | Consecuencia si incumple |
|-----------|-------------|------------------------|
| Reportar datos cada 60s | Monitoring (freshness por CPO) | Alerta → Suspensión si recurrente |
| Datos veraces | Anomaly detection, cross-validation | Reporte a SIC |
| Mantener certificado mTLS vigente | cert-manager, alertas expiración | Bloqueo de acceso |
| Cumplir schema OCPI 2.2.1 | Validador Python | Rechazo de datos + alerta |
| Mantener registro Cárgame activo | Validación periódica (24h) | Suspensión automática |

---

## Integración con Cárgame — Aspectos Legal/Contractuales

| Aspecto | Detalle |
|---------|---------|
| **Naturaleza** | Sistema externo de registro de CPOs, administrado por MinEnergía |
| **Conectividad** | VPN IPSec IKEv2 site-to-site |
| **SLA Cárgame** | No hay SLA formal → UPME debe diseñar para falla (caché 24h, circuit breaker) |
| **Datos intercambiados** | Estado de habilitación del CPO (ACTIVE/INACTIVE/SUSPENDED) |
| **Frecuencia** | On-demand (validación) + polling periódico (24h) |
| **Responsabilidad** | Cárgame es source of truth para habilitación; UPME NO puede habilitar CPOs |

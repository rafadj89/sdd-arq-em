# Plantilla — Runbook de Alertas

```markdown
# Runbook: [Nombre de la alerta]

## Metadata
- **Severidad:** P1 | P2 | P3 | P4 | P5
- **Servicio:** [Nombre del servicio]
- **SLO impactado:** [Cual SLO]
- **Ultima revision:** YYYY-MM-DD

## Descripcion
[Que significa esta alerta? Por que es importante?]

## Impacto
- **Usuarios afectados:** [CPOs / Ciudadanos / Admin / Todos]
- **Regulatorio:** [Afecta Resolucion 40559? SIC?]
- **SLA:** [Error budget consumido?]
- **Datos:** [Riesgo de perdida o corrupcion?]

## Diagnostico

### Paso 1: Verificar dashboard
Ir a [URL del dashboard] > panel [nombre]

### Paso 2: Consultar logs
```
query: service=[X] AND level=ERROR AND correlation_id=...
```

### Paso 3: Verificar traza
Buscar trace_id en Jaeger/OCI APM

### Paso 4: Verificar dependencias
- [ ] Redis
- [ ] Database
- [ ] Kafka
- [ ] Cargame VPN
- [ ] KeyCloak

## Remediacion

### Automatica
[Describir auto-remediation si existe]

### Manual
1. **Paso 1:** [Descripcion + comando]
2. **Paso 2:** [Descripcion + comando]
3. **Paso 3:** [Descripcion + comando]

### Rollback
[Como revertir si la remediacion falla]

## Escalacion

| Tiempo | Accion | Contacto |
|--------|--------|----------|
| +0 min | Notificacion on-call | PagerDuty |
| +15 min | Tech Lead | [Nombre] |
| +30 min | Arquitecto | [Nombre] |
| +60 min | Gerencia IT | [Nombre] |

## Comunicacion
- **Interna:** Slack #incidents cada 15 min
- **CPOs:** Si > 30min, notificar via [canal]
- **MinEnergia:** Si datos publicos > 1h, notificar

## Post-mortem
Crear incident report si downtime > [X min] o SLA impactado.

## Historial de Incidentes

| Fecha | Causa | Resolucion | Tiempo |
|-------|-------|------------|--------|
| | | | |
```

# Plantilla — Architecture Decision Record (ADR)

```markdown
# ADR-NNN: [Titulo de la decision]

## Estado
Propuesto | Aceptado | Deprecado | Sustituido por ADR-XXX

## Fecha
YYYY-MM-DD

## Participantes
- [Nombre/Rol] — autor
- [Nombre/Rol] — revisor

## Contexto
[Describir el problema o necesidad. Incluir constraints tecnicos, regulatorios y de negocio.
Referenciar requisitos de la Resolucion 40559 si aplica.]

## Decision
[Describir la decision tomada de forma clara y concisa.]

## Alternativas Consideradas

### Alternativa 1: [Nombre]
- **Pros:** ...
- **Contras:** ...
- **Razon de descarte:** ...

### Alternativa 2: [Nombre]
- **Pros:** ...
- **Contras:** ...
- **Razon de descarte:** ...

## Consecuencias

### Positivas
- ...

### Negativas / Trade-offs
- ...

### Riesgos
| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|-----------|
| | | | |

## Cumplimiento Regulatorio
- **Resolucion 40559:** [Impacto]
- **Ley 1581/2012:** [Impacto en datos personales]
- **SIC:** [Impacto en auditoria]
- **Plazos mandatorios:** [Afecta algun hito?]

## Impacto Tecnico
- **Seguridad:** [Checklist items afectados]
- **Observabilidad:** [Metricas/logs/trazas necesarios]
- **Performance:** [SLOs impactados]
- **DRP:** [Impacto en disaster recovery]
- **CI/CD:** [Cambios en pipeline]

## Plan de Reversion
[Que hacer si esta decision resulta incorrecta. Costo estimado de revertir.]

## Plan de Implementacion
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

## Criterios de Exito
- [ ] [Criterio medible 1]
- [ ] [Criterio medible 2]

## Referencias
- [Links a documentacion, specs, discusiones]
```

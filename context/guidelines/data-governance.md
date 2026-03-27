# Gobernanza de Datos y Cumplimiento

## Visión

El dato en la plataforma UPME no es un subproducto operacional — es un **activo de gobierno**. Cada dato que ingresa al sistema tiene trazabilidad, clasificación, calidad medida y propósito regulatorio definido.

---

## Responsabilidades de Gobernanza de Datos

| Responsabilidad | Descripción |
|----------------|-------------|
| **Catálogo de datos** | Actualizado con clasificación de sensibilidad |
| **Linaje end-to-end** | Trazabilidad desde el CPO hasta el consumidor final |
| **Calidad de datos** | Medida, monitoreada y alertada |
| **Reportes regulatorios** | Datos listos para MinEnergía, SIC, CREG |
| **Detección de anomalías** | Datos reportados por CPOs verificados |
| **Clasificación PII** | Ley 1581/2012 cumplida |

---

## Catálogo de Datos (OCI Data Catalog)

### Clasificación de Sensibilidad

| Clasificación | Descripción | Ejemplos | Protección |
|--------------|-------------|----------|-----------|
| **Público** | Datos de consulta abierta | Precios, ubicación estaciones, disponibilidad | Caché, CDN, API Open Data |
| **Interno** | Datos operacionales UPME | Métricas de sistema, logs operacionales | Acceso por rol |
| **Confidencial** | Datos comerciales de CPOs | Volumen de sesiones, ingresos, SLA compliance | Cifrado + acceso por CPO |
| **Restringido (PII)** | Datos personales (Ley 1581) | Emails de contacto CPO, nombres de responsables | Cifrado + enmascaramiento + auditoría |
| **Regulatorio** | Datos para supervisión | Audit trail, reportes SIC, anomalías | WORM + acceso SIC/MinEnergía |

### Business Glossary

Términos estándar para stakeholders no técnicos:

| Término | Definición | Módulo OCPI |
|---------|-----------|-------------|
| **Estación de carga** | Instalación física con uno o más puntos de carga | Location |
| **Punto de carga (EVSE)** | Equipo individual para cargar un vehículo | EVSE |
| **Conector** | Interfaz física de conexión (Tipo 1, Tipo 2, CCS, CHAdeMO) | Connector |
| **Sesión de carga** | Evento de carga desde inicio hasta fin | Session |
| **CDR** | Registro detallado de una sesión completada (costos, energía) | CDR |
| **Tarifa** | Estructura de precios por kWh, tiempo, o sesión | Tariff |
| **CPO** | Operador de puntos de carga (empresa registrada en Cárgame) | — |
| **MSP** | Proveedor de servicios de movilidad eléctrica | — |

---

## Linaje de Datos End-to-End

```
Origen          Ingesta          Validación       Almacenamiento      Consumo
──────          ───────          ──────────       ──────────────      ───────
CPO Device  →  API Gateway  →  Ingesta (Go)  →  Kafka  →  ┬→ ATP (operacional)
                                    │                       ├→ Bronze (raw, WORM)
                              Validador (Py)                ├→ Silver (curated)
                                    │                       ├→ Gold (governance)
                              ¿Válido?                      └→ TimescaleDB (telemetría)
                               │      │
                              Sí     No → DLQ                  Consumidores:
                                     + alerta                  ├→ API Open Data (ciudadanos)
                                                               ├→ Dashboard UPME (admin)
                                                               ├→ Reportes MinEnergía
                                                               ├→ Auditoría SIC
                                                               └→ Analytics / ML
```

Cada dato tiene registrado en el Data Catalog:
- **Origen**: CPO ID, timestamp de generación
- **Transformaciones**: Validaciones aplicadas, enriquecimientos
- **Destino**: Dónde se almacena y quién lo consume
- **Clasificación**: Nivel de sensibilidad
- **Retención**: Política aplicable

---

## Calidad de Datos

### Dimensiones de Calidad

| Dimensión | Definición | Métrica | Umbral |
|-----------|-----------|---------|--------|
| **Freshness** | Tiempo desde generación hasta disponibilidad | Max(now - timestamp) | < 5 min (operacional), < 60s (público) |
| **Volume** | Cantidad de registros vs baseline esperado | Count por CPO por hora | ±2sigma del baseline 7 días |
| **Schema** | Conformidad con schema OCPI 2.2.1 | % registros válidos | > 99% |
| **Completeness** | Campos obligatorios presentes | % campos no-null | 100% obligatorios |
| **Uniqueness** | Ausencia de duplicados | % registros únicos (por request_id) | 100% |
| **Consistency** | Coherencia con datos históricos | Variación vs baseline | Sin cambios abruptos injustificados |
| **Timeliness** | Timestamp dentro de ventana aceptable | timestamp - now | < 5 minutos |
| **Accuracy** | Datos reflejan realidad física | Cross-validation (ej: kWh vs capacidad conector) | Sin violaciones físicas |

### Pipeline de Calidad

```
Cada dato que ingresa al sistema pasa por:

1. Schema validation (Ingesta)     → Rechazo inmediato si inválido
2. Business rules (Validador)      → Rechazo + DLQ si violación
3. Cross-reference (Silver ETL)    → Flag si inconsistente
4. Anomaly detection (Gold ETL)    → Alerta si anómalo
5. Quality score (Data Catalog)    → Registrado por CPO/módulo/día
```

---

## Detección de Anomalías

### Algoritmos

1. **Baseline por CPO**: Media móvil 7 días + desviación estándar
2. **Z-score en tiempo real**: Alerta si |z| > 3
3. **Seasonal decomposition**: Patrones horarios/diarios/semanales
4. **Reglas de negocio**: Validaciones físicas y lógicas

### Tipos de Anomalía

| Tipo | Regla | Severidad | Acción |
|------|-------|-----------|--------|
| **PRECIO** | Cambio > 50% en < 1h, negativo, = 0 prolongado | Alta | Alert + notificar CPO + log SIC |
| **DISPONIBILIDAD** | "Available" sin sesiones > 24h, cambio masivo de estado | Media | Alert + investigar |
| **VOLUMEN** | CPO reporta 0 datos > 1h, spike > 5x baseline | Alta | Alert + circuit breaker check |
| **TEMPORAL** | Timestamps futuros o > 5min antigüedad | Media | Rechazar + alert |
| **GEOGRAFICO** | Ubicación de estación cambió > 1km | Alta | Alert + verificar |
| **ENERGIA** | kWh reportados > capacidad física del conector | Alta | Rechazar + alert + log SIC |

### Cada anomalía genera:
1. Alert ticket con severidad auto-calculada
2. Notificación al CPO (si origen es el CPO)
3. Log inmutable para auditoría SIC
4. Tag en Data Lake Silver para trazabilidad

---

## Cumplimiento Regulatorio

### Ley 1581/2012 — Protección de Datos Personales

| Requisito | Implementación |
|-----------|---------------|
| Consentimiento | Registro CPO incluye aceptación de tratamiento |
| Finalidad | Datos usados solo para interoperabilidad y supervisión |
| Acceso | CPO puede consultar sus propios datos vía API |
| Corrección | CPO puede corregir datos propios |
| Supresión | Datos eliminados según política de retención |
| Seguridad | Cifrado en tránsito y reposo, acceso por rol |
| Transferencia | No hay transferencia a terceros fuera de supervisión |

### Reportes Regulatorios

| Reporte | Destinatario | Frecuencia | Datos | Formato |
|---------|-------------|-----------|-------|---------|
| Estado de estaciones | MinEnergía | Mensual | Disponibilidad, uptime por región | CSV + PDF |
| Actividad de CPOs | SIC | Bajo demanda | Sesiones, CDRs, anomalías | JSON + PDF |
| KPIs nacionales | UPME (interno) | Semanal | Dashboard con todas las métricas | Dashboard + Excel |
| Calidad de datos | MinEnergía | Trimestral | Scores por CPO, anomalías | PDF |
| Incidentes de seguridad | MinTIC | Cuando ocurran | Detalle del incidente | Formato MSPI |

---

## Retención de Datos

| Capa | Retención | Justificación |
|------|-----------|---------------|
| **ATP (operacional)** | 90 días | Datos calientes para operación |
| **Bronze (raw)** | 2 años | Cadena de custodia, auditoría SIC |
| **Silver (curated)** | 5 años | Análisis histórico, compliance |
| **Gold (governance)** | Indefinido | KPIs nacionales, reporting |
| **Audit logs** | 5 años mínimo | Requisito regulatorio SIC |
| **TimescaleDB** | 90 días | Telemetría caliente |

### Lifecycle Policies (OCI Object Storage)

```
Bronze: Standard (0-90 días) → Infrequent Access (90-365 días) → Archive (1-2 años) → Delete
Silver: Standard (0-1 año) → Infrequent Access (1-5 años) → Archive (si se mantiene)
Gold:   Standard (indefinido) — nunca se archiva ni elimina
Audit:  Standard + WORM policy (inmutable, 5 años mínimo)
```

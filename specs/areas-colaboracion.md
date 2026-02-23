# Áreas de Colaboración — Equipo Extendido del Proyecto

## Equipo 2: Áreas de Colaboración

Además del equipo IT (8 personas), el proyecto requiere la participación activa de las siguientes áreas.

---

### 1. Legal / Jurídica (UPME + MinEnergía)

**Responsabilidades:**
- Definición de términos y condiciones de uso de la plataforma para cada actor
- Marco legal de acceso para CPOs: requisitos de registro, obligaciones, sanciones
- Definiciones legales para cada tipo de actor:
  - **CPO:** Contrato de adhesión, responsabilidades de reporte, penalidades por incumplimiento
  - **MinEnergía:** Marco de supervisión, acceso a datos agregados
  - **Clientes consumidores:** Política de privacidad, protección de datos (Ley 1581/2012)
  - **Áreas internas UPME:** Acuerdos de uso de datos del Data Lake, niveles de acceso
- Especificación del SLA contractual con cada CPO
- Marco legal de la integración con Cárgame:
  - Responsabilidad cuando un CPO es habilitado/deshabilitado automáticamente
  - Procedimiento de apelación para CPOs dados de baja
  - Responsabilidad en caso de indisponibilidad de Cárgame
- Cumplimiento de Ley 1581 de 2012 (Protección de Datos Personales)
- Revisión legal de la Guía de Implementación antes de publicación

**Participación en hitos:**
- Desde Fase 1 (definiciones iniciales) hasta Go-Live
- Revisión de Guía de Implementación (pre-publicación)
- Validación de términos del Sandbox y Producción

---

### 2. Seguridad IT UPME

**Responsabilidades:**
- Definición y calibración de políticas WAF para la nueva plataforma
- Validación de arquitectura de seguridad (VCN, NSGs, Security Lists)
- Revisión de políticas de cifrado (TLS, mTLS, Vault)
- Definición de política de filtrado por IP pública de CPOs
- Evaluación de riesgos y plan de mitigación
- Participación en penetration testing y SAST/DAST
- Definición de política de gestión de certificados
- Auditoría de accesos y logs de seguridad
- Validación de cumplimiento con estándares de seguridad gubernamentales
- Aprobación de configuración de OCI Vault y manejo de secrets

**Participación en hitos:**
- Fase 1: Aprobación de arquitectura de seguridad
- Fase 2: Validación de autenticación y autorización
- Fase 5: Revisión de seguridad del Sandbox público
- Fase 6: Penetration testing final, aprobación para Go-Live

---

### 3. Entidad Externa de Referencia (Experto Red Eléctrica — España)

**Responsabilidades:**
- Asesoría basada en experiencia de la Guía SGV (Sistema de Gestión y Visualización de Puntos de Recarga Eléctricos) de España
- Revisión de la arquitectura de interoperabilidad y recomendaciones
- Benchmarking con implementación europea de OCPI
- Asesoría en procesos de certificación de CPOs
- Recomendaciones sobre gobernanza de datos del sector eléctrico
- Lecciones aprendidas de la operación en España

**Participación en hitos:**
- Fase 1: Workshop de arquitectura y mejores prácticas
- Fase 2: Revisión de implementación OCPI vs estándar europeo
- Fase 5: Revisión del proceso de certificación Sandbox
- Fase 6: Validación final pre Go-Live

**Entidades candidatas a contactar:**
- Red Eléctrica de España (REE) / e-distribución
- CNMC (Comisión Nacional de los Mercados y la Competencia)
- Consultoras especializadas en OCPI (eMI3, ElaadNL)

---

### 4. Entidades CPO (Integradores Potenciales)

**Responsabilidades:**
- Colaboración temprana para validar arquitectura desde perspectiva del integrador
- Participación en pruebas de concepto (PoC) de cada capa de la arquitectura
- Feedback sobre la Guía de Implementación y documentación técnica
- Validación de procesos de onboarding y certificación
- Certificación piloto en cada hito/etapa del proyecto
- Reporte de fricciones y dificultades de integración
- Co-creación de la suite de compliance tests

**Participación en hitos:**
- Fase 2: PoC de integración OCPI básica (1-2 CPOs piloto)
- Fase 4: Validación del portal y experiencia de desarrollador
- Fase 5: Beta testing del Sandbox con 3-5 CPOs
- Fase 6: Certificación piloto pre Go-Live

**CPOs candidatos para programa piloto:**
- CPOs grandes con capacidad técnica (Enel X, Celsia, Terpel)
- Al menos 1 CPO mediano para validar experiencia de integrador pequeño
- Total recomendado: 3-5 CPOs en programa piloto

---

## Matriz de Participación por Fase

| Área | F1 Fundación | F2 Core OCPI | F3 Data Lake | F4 Portal | F5 Sandbox | F6 Go-Live |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| Legal/Jurídica | Alta | Media | Baja | Media | Alta | Alta |
| Seguridad IT | Alta | Alta | Baja | Baja | Alta | Alta |
| Entidad Externa | Alta | Media | Baja | Baja | Media | Alta |
| CPOs Piloto | Baja | Alta | Baja | Media | Alta | Alta |

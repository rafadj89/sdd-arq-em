# Seguridad On-Premise e Infraestructura Híbrida

## Marco de Referencia

| Estándar | Aplicación |
|----------|-----------|
| **MSPI MinTIC** | Modelo de Seguridad y Privacidad de la Información (Colombia) |
| **ISO 27001:2022** | Sistema de gestión de seguridad |
| **ISO 27017** | Cloud Security controls |
| **ISO 27018** | PII en Cloud |
| **CIS Controls v8** | Controles de seguridad prioritizados |
| **NIST CSF** | Cybersecurity Framework (Identify, Protect, Detect, Respond, Recover) |
| **Ley 1581/2012** | Protección de Datos Personales |
| **Decreto 1377/2013** | Reglamentación Ley 1581 |

---

## Dominios de Expertise

### Hardening de Servidores

| Actividad | Detalle |
|-----------|---------|
| Baseline | CIS Benchmarks para Linux/Windows aplicados |
| Servicios | Solo los necesarios habilitados, resto deshabilitado |
| Usuarios | Root/Admin deshabilitado para login remoto |
| SSH | Solo key-based, no password, puerto no-estándar |
| Firewall local | iptables/nftables con whitelist explícita |
| Auditoría | auditd configurado para operaciones sensibles |

### Seguridad de Red On-Premise

```
Internet
    │
┌───▼───────────────┐
│   Firewall Ext    │  IP filtering, DDoS mitigation
│   (Perimetral)    │
└───┬───────────────┘
    │
┌───▼───────────────┐
│      DMZ          │  WAF on-prem, reverse proxy, LB
│   (ModSecurity)   │
└───┬───────────────┘
    │
┌───▼───────────────┐
│   Firewall Int    │  IDS/IPS (Snort/Suricata)
│                   │
└───┬───────────────┘
    │
┌───▼───────────────┐     ┌──────────────────┐
│   VLAN App        │     │   VLAN Data      │
│   (Servidores     │◄───►│   (BD, Redis,    │
│    aplicación)    │     │    backups)       │
└───────────────────┘     └──────────────────┘
```

### VPN Site-to-Site — Cárgame

| Parámetro | Configuración |
|-----------|---------------|
| Protocolo | IPSec IKEv2 |
| Cifrado | AES-256-GCM |
| Integridad | SHA-384 |
| DH Group | Group 20 (384-bit ECDH) |
| Autenticación | Pre-shared key + certificados |
| Túneles | Redundantes (activo/activo) |
| Monitoreo | Health checks cada 10s, alerta si down > 2min |
| Failover | Automático al túnel backup |
| Logs | Todos los eventos de túnel registrados en SIEM |

### PKI Interna (CA UPME)

```
CA Root (OFFLINE)
  │
  └── CA Intermedia (ONLINE)
        │
        ├── Certificados mTLS para CPOs
        │     └── Emisión: manual tras validación Cárgame
        │     └── Validez: 1 año
        │     └── Revocación: CRL + OCSP
        │
        ├── Certificados de servidor (TLS)
        │     └── Auto-renewal via cert-manager
        │
        └── Certificados de servicio (inter-service mTLS)
              └── Rotation automática
```

| Componente | Detalle |
|-----------|---------|
| CA Root | OFFLINE, almacenada en HSM, solo para firmar CA intermedia |
| CA Intermedia | ONLINE, firma certificados de endpoint |
| CRL | Publicada cada 24h y on-demand tras revocación |
| OCSP Responder | Verificación en tiempo real del estado del certificado |
| Almacenamiento | Keys en HSM (OCI Vault o HSM on-prem) |

### LDAP/Active Directory

| Función | Detalle |
|---------|---------|
| User Federation | KeyCloak sincroniza con AD/LDAP de UPME |
| Grupo sync | Grupos AD → Roles KeyCloak |
| MFA | Obligatorio para admin (TOTP o hardware key) |
| Políticas de grupo | Password complexity, lockout, session timeout |

### Gestión de Parches

| Severidad | Tiempo de aplicación | Ventana |
|-----------|---------------------|---------|
| Crítica (CVSS > 9.0) | 72 horas | Emergencia (aprobación acelerada) |
| Alta (CVSS 7.0-8.9) | 7 días | Mantenimiento programado |
| Media (CVSS 4.0-6.9) | 30 días | Siguiente ventana de mantenimiento |
| Baja (CVSS < 4.0) | 90 días | Siguiente ciclo trimestral |

### Backup & Recovery

| Componente | RPO | RTO | Frecuencia | Cifrado | Prueba |
|-----------|-----|-----|-----------|---------|--------|
| Base de datos | 1h | 30min | Cada hora (incremental), diario (full) | AES-256 | Mensual |
| Configuración | 24h | 1h | Diario | AES-256 | Trimestral |
| Certificados PKI | 0 (redundante) | 15min | Redundancia activa | HSM | Semestral |
| Logs SIEM | 0 (streaming) | N/A | Tiempo real | TLS + at-rest | N/A |

---

## Checklist de Seguridad On-Premise

Aplicar a **TODA** propuesta:

```
□ Baseline de seguridad (CIS Benchmark) aplicado a todo servidor
□ Segmentación de red: DMZ para servicios expuestos, VLAN separadas por función
□ VPN IPSec IKEv2 con Cárgame: túneles redundantes, monitoreo, alertas si down
□ PKI interna operativa: CA root offline, CA intermedia online, CRL publicada
□ Cifrado de datos en reposo en discos locales (LUKS/BitLocker)
□ MFA obligatorio para acceso administrativo
□ Logs centralizados en SIEM con retención mínima 1 año
□ Política de parches: críticos en 72h, altos en 7 días, medios en 30 días
□ Backup cifrado con prueba de restauración mensual
□ Plan de respuesta a incidentes documentado y probado
□ Escaneo de vulnerabilidades mensual (Nessus/OpenVAS)
□ Acceso a producción solo vía bastion/jump server con sesiones grabadas
```

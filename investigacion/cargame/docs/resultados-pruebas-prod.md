# Resultados Pruebas Produccion CargaME API

**Fecha:** 2026-03-26
**Ejecutado desde:** Red externa (internet publica)

---

## Resumen

| Prueba | Endpoint | Status | Resultado |
|--------|----------|--------|-----------|
| Departamentos (publico) | `GET /crg/departamento/0` | **500** | Error interno DB |
| Tipos estacion (publico) | `GET /crg/tipoestacion/0` | **500** | Error interno DB |
| Resumen estaciones (auth) | `GET /crg/resumenestacionescarga/0/0/0/11001/` | **500** | Error interno DB |
| Login (POST vacio) | `POST /crg/logueo` | **500** | Error interno DB |
| Frontend CargaME | `GET https://cargame.minenergia.gov.co` | **200** | App Angular cargando OK |

---

## Hallazgos Clave

### 1. Conectividad: OK
- DNS resuelve `siveeic.minenergia.gov.co` correctamente
- TLS/HTTPS funciona en puerto 3011
- No hay bloqueo de firewall desde red externa
- Latencia: ~40-55ms (Colombia → servidor)

### 2. API Node.js: CORRIENDO pero con DB caida
Todas las respuestas retornan el mismo error:
```
TypeError: Cannot read property 'request' of undefined
    at /opt/api_cargave/src/services/databaseMssql.js:42:43
```

**Interpretacion:**
- La API Express esta corriendo en `/opt/api_cargave/`
- Usa **SQL Server** como base de datos (`databaseMssql.js`)
- La conexion a SQL Server esta rota (pool de conexiones no inicializado)
- **NO es un problema de autenticacion ni CORS** — es un error interno del servidor

### 3. Frontend CargaME: OK
- `https://cargame.minenergia.gov.co` responde con la app Angular
- Titulo: "Estaciones de Carga Vehiculos Electricos"
- Usa Google Maps API (key visible en HTML)
- Framework: Angular con Material Design

### 4. Stack tecnologico confirmado
| Componente | Tecnologia |
|-----------|-----------|
| Frontend | Angular + Material Design |
| Backend API | Node.js + Express |
| Base de datos | **Microsoft SQL Server** (MSSQL) |
| Mapas | Google Maps API |
| Hosting | `/opt/api_cargave/` en servidor MinEnergia |
| Puerto API | 3011 (HTTPS) |
| Dominio API | siveeic.minenergia.gov.co |
| Dominio Frontend | cargame.minenergia.gov.co |

---

## Diagnostico del Error 500

El error `Cannot read property 'request' of undefined` en `databaseMssql.js:42` indica:

1. El modulo `mssql` de Node.js intenta hacer un `.request()` sobre un pool de conexiones que es `undefined`
2. **Posibles causas:**
   - SQL Server esta caido o inaccesible desde el servidor de la API
   - El pool de conexiones no se inicializo correctamente al arrancar la API
   - Credenciales de BD expiradas o cambiadas
   - El servicio SQL Server fue reiniciado y el pool no se reconecto

3. **Esto NO es un problema nuestro** — es un problema de infraestructura de MinEnergia/CargaME

---

## Proximos Pasos

### Inmediatos
1. **Reportar el error 500** al equipo de CargaME/MinEnergia — la BD esta caida
2. **Solicitar credenciales propias** (email/password) para UPME
3. **Reintentar las pruebas** cuando confirmen que la BD esta operativa
4. **Solicitar acceso VPN** si las APIs solo deben funcionar desde red interna

### Cuando la API este operativa
1. Ejecutar `curl-prod-requests.sh` completo
2. Documentar las respuestas JSON reales
3. Mapear los campos de respuesta a los modelos OCPI 2.2.1
4. Iniciar el desarrollo del Anti-Corruption Layer (ACL) CargaME → UPME

### Collection Postman lista para usar
- **Environment:** `docs/api_cargame.prod.postman_environment.json`
- **Collection:** `docs/api_cargame.prod.postman_collection.json`
- Importar ambos en Postman y ejecutar la carpeta "00 — Health Check" primero

---

## Nota sobre el Token de Servicio

El token PowerBI extraido del curl de produccion:
- **Funciona para autenticacion** (la API lo acepta antes de llegar a la DB)
- **Puede dejar de funcionar** si MinEnergia rota el secret HS256
- **No reemplaza credenciales propias** — necesitamos usuario UPME oficial
- El header debe enviarse como `authorization` (minuscula, sin "Bearer")

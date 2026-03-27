# Documentacion API CargaME — Analisis Completo

> **Fuente:** Documentacion oficial recibida 2026-03-26 + analisis de collection Postman + curl de produccion
> **Ultima actualizacion:** 2026-03-26

---

## 1. Infraestructura

| Ambiente | Base URL | Notas |
|----------|----------|-------|
| **Local** | `http://localhost:3011/crg` | Desde Postman collection original |
| **Produccion** | `https://siveeic.minenergia.gov.co:3011/crg` | Descubierto del curl prod |
| **Frontend** | `https://cargame.minenergia.gov.co` | Origin/Referer en requests prod |

- **Prefijo global:** `/crg`
- **Puerto:** `3011` (tanto local como produccion)
- **Backend:** Node.js (Express) — inferido de `src/routers/*.js` en collection
- **Protocolo prod:** HTTPS (puerto no-estandar 3011)
- **Dominio:** `siveeic.minenergia.gov.co` — dominio del Sistema de Vigilancia Energetica del MinEnergia

---

## 2. Autenticacion

### Mecanismo: JWT (JSON Web Token)

| Parametro | Valor |
|-----------|-------|
| Algoritmo | HS256 (HMAC-SHA256) |
| Headers soportados | `Authorization: Bearer <token>` o `x-access-token: <token>` |
| Vigencia token login | 14400 segundos (4 horas) |
| Login endpoint | `POST /crg/logueo` |

### Token de Servicio (Produccion)

Del curl de produccion se extrajo un **token estatico** de servicio:

```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MCwidXN1YXJpbyI6InBvd2VyYmkiLCJyb2xlIjoiaW50ZWxsaWdlbmNlIiwiaWF0IjoxNTk0ODQ5NjMxfQ.UY3BLtqi5zdxpRFaT9XIsYvQIV4gPPXN6iO39AlymMY
```

**Payload decodificado:**
```json
{
  "id": 0,
  "usuario": "powerbi",
  "role": "intelligence",
  "iat": 1594849631
}
```

**Observaciones criticas:**
- `iat` = 1594849631 → **16 de julio de 2020** — token emitido hace ~6 anos
- **NO tiene campo `exp`** → token sin expiracion (permanente)
- Usuario: `powerbi` con rol `intelligence` — cuenta de servicio para BI
- `id: 0` — ID especial (posiblemente superusuario o cuenta de sistema)
- En produccion se envia como header `authorization` (minuscula, sin prefijo "Bearer")

### Login (para obtener tokens regulares)

```
POST /crg/logueo
Content-Type: application/json

{
  "email": "<usuario>",
  "password": "<clave>",
  "pre": ""
}
```

**Respuesta exitosa (200):**
```json
{
  "usuario": "<nombre>",
  "token": "<JWT>"
}
```

**Errores:**
- `401` — Usuario o contrasena invalidos
- `404` — Usuario inactivo o no existe

---

## 3. Catalogo Completo de Endpoints

### 3.1 Auth (Autenticacion)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `POST` | `/crg/logueo` | No | Login — devuelve JWT |
| `PUT` | `/crg/recuperar/:id` | Si | Recuperar contrasena |
| `POST` | `/crg/validar` | Si | Validar credenciales (Id, Registro) |
| `POST` | `/crg/solicitud` | Si | Solicitud de acceso |
| `PUT` | `/crg/primeringreso/:id` | Si | Primer ingreso (cambio de clave) |

### 3.2 General (Catalogos publicos y consentimiento)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `GET` | `/crg/consentimiento/:id/:id_usuario/:modulo` | Si | Consultar consentimiento |
| `POST` | `/crg/consentimiento/:id/:id_usuario/:modulo` | Si | Registrar consentimiento |
| `GET` | `/crg/departamento/:id` | **No** | Listar departamentos |
| `GET` | `/crg/municipio/:id/:id_departamento` | **No** | Listar municipios por depto |
| `GET` | `/crg/municipiofull/:id/:id_departamento` | **No** | Municipios completo |
| `GET` | `/crg/periodo/:id` | **No** | Periodos |
| `GET` | `/crg/periodoanio/:id` | **No** | Periodos por ano |
| `GET` | `/crg/fuentefinancia/:id/:fuente` | **No** | Fuentes de financiacion |
| `GET` | `/crg/tiposolucion/:id` | **No** | Tipos de solucion |
| `GET` | `/crg/ciclofactura/:id` | **No** | Ciclos de facturacion |
| `GET` | `/crg/servicioscomparto/:id` | **No** | Servicios comparto |
| `GET` | `/crg/niveleducacion/:id` | **No** | Niveles de educacion |
| `GET` | `/crg/genero/:id` | **No** | Generos |
| `GET` | `/crg/tipodosimetro/:id` | **No** | Tipos de dosimetro |
| `GET` | `/crg/tecnodosimetro/:id` | **No** | Tecnologias dosimetro |
| `GET` | `/crg/practicasri/:id` | **No** | Practicas RI |
| `GET` | `/crg/ciclodosimetria/:id` | **No** | Ciclos de dosimetria |
| `GET` | `/crg/tipoubicacion/:id` | **No** | Tipos de ubicacion |
| `GET` | `/crg/tipoestacion/:id` | **No** | Tipos de estacion |
| `GET` | `/crg/modelotarifa/:id` | **No** | Modelos de tarifa |
| `GET` | `/crg/tipopersona/:id` | **No** | Tipos de persona |
| `GET` | `/crg/tipoestandar/:id/:nombre` | **No** | Tipos estandar |
| `GET` | `/crg/canalmanual/:id/:tipo` | **No** | Canales de manual |
| `POST` | `/crg/contactoestaciones/:id` | **No** | Contacto de estaciones |

### 3.3 Parametros (requieren auth)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `GET` | `/crg/variable/:id/:tipo/:nombre` | Si | Consultar variable |
| `POST` | `/crg/variable/:id/:tipo/:nombre` | Si | Crear variable |
| `PUT` | `/crg/variable/:id/:tipo/:nombre` | Si | Actualizar variable |
| `DELETE` | `/crg/variable/:id/:tipo/:nombre` | Si | Eliminar variable |
| `GET` | `/crg/servicioweb/:id/:tipo` | Si | Consultar servicio web |
| `POST` | `/crg/servicioweb/:id/:tipo` | Si | Crear servicio web |
| `PUT` | `/crg/servicioweb/:id/:tipo` | Si | Actualizar servicio web |
| `DELETE` | `/crg/servicioweb/:id/:tipo` | Si | Eliminar servicio web |
| `GET` | `/crg/txtbusqueda/:id/:tipo` | Si | Consultar textos busqueda |
| `POST` | `/crg/txtbusqueda/:id/:tipo` | Si | Crear texto busqueda |
| `PUT` | `/crg/txtbusqueda/:id/:tipo` | Si | Actualizar texto busqueda |
| `DELETE` | `/crg/txtbusqueda/:id/:tipo` | Si | Eliminar texto busqueda |

### 3.4 Usuarios (requieren auth)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `GET` | `/crg/tipo_usuario/:id/:mod` | Si | Tipos de usuario |
| `POST` | `/crg/tipo_usuario/:id/:mod` | Si | Crear tipo usuario |
| `PUT` | `/crg/tipo_usuario/:id/:mod` | Si | Actualizar tipo usuario |
| `DELETE` | `/crg/tipo_usuario/:id/:mod` | Si | Eliminar tipo usuario |
| `GET` | `/crg/usuario/:id/:tipo_usuario` | Si | Consultar usuario |
| `POST` | `/crg/usuario/:id/:tipo_usuario` | Si | Crear usuario |
| `PUT` | `/crg/usuario/:id/:tipo_usuario` | Si | Actualizar usuario |
| `DELETE` | `/crg/usuario/:id/:tipo_usuario` | Si | Eliminar usuario |
| `GET` | `/crg/tipo_identificacion/:id` | **No** | Tipos de identificacion |
| `GET` | `/crg/tipo_estado/:id` | **No** | Tipos de estado |
| `GET` | `/crg/coordinacion/:id/:tipo` | **No** | Coordinaciones |
| `GET` | `/crg/nombre_usuario/:user/:ident` | Si | Nombre de usuario |
| `GET` | `/crg/resumen_usuario/:user/:ident` | Si | Resumen de usuario |

### 3.5 Perfiles (requieren auth)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `GET` | `/crg/permisos/:id` | Si | Consultar permisos |
| `GET` | `/crg/grupomenu/:id` | Si | Grupos de menu |
| `POST` | `/crg/grupomenu/:id` | Si | Crear grupo menu |
| `PUT` | `/crg/grupomenu/:id` | Si | Actualizar grupo menu |
| `DELETE` | `/crg/grupomenu/:id` | Si | Eliminar grupo menu |
| `GET` | `/crg/enlacemenu/:id/:id_grupo` | Si | Enlaces de menu |
| `POST` | `/crg/enlacemenu/:id/:id_grupo` | Si | Crear enlace menu |
| `PUT` | `/crg/enlacemenu/:id/:id_grupo` | Si | Actualizar enlace menu |
| `DELETE` | `/crg/enlacemenu/:id/:id_grupo` | Si | Eliminar enlace menu |
| `GET` | `/crg/perfilmenu/:id/:rol/:enlace` | Si | Perfil de menu |
| `POST` | `/crg/perfilmenu/:id/:rol/:enlace` | Si | Crear perfil menu |
| `PUT` | `/crg/perfilmenu/:id/:rol/:enlace` | Si | Actualizar perfil menu |
| `DELETE` | `/crg/perfilmenu/:id/:rol/:enlace` | Si | Eliminar perfil menu |

### 3.6 Operador (requieren auth)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `GET` | `/crg/operador/:id` | Si | Consultar operador(es) |
| `POST` | `/crg/operador/:id` | Si | Crear operador |
| `PUT` | `/crg/operador/:id` | Si | Actualizar operador |
| `DELETE` | `/crg/operador/:id` | Si | Eliminar operador |
| `GET` | `/crg/tipo_operador/:id` | Si | Tipos de operador |
| `GET` | `/crg/contactoop/:id/:id_operador/:tipo_identificacion/:nro_identificacion` | Si | Contacto de operador |
| `POST` | `/crg/contactoop/:id/:id_operador/:tipo_identificacion/:nro_identificacion` | Si | Crear contacto op |
| `PUT` | `/crg/contactoop/:id/:id_operador/:tipo_identificacion/:nro_identificacion` | Si | Actualizar contacto op |
| `DELETE` | `/crg/contactoop/:id/:id_operador/:tipo_identificacion/:nro_identificacion` | Si | Eliminar contacto op |

### 3.7 Estaciones de Carga (requieren auth) — **MAS RELEVANTE PARA UPME**

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `GET` | `/crg/estacionoperador/:id/:id_operador/:id_departamento/:id_municipio` | Si | Estaciones por operador |
| `PUT` | `/crg/validaestacion/:id` | Si | Validar estacion |
| `GET` | `/crg/estacioncarga/:id/:id_operador/:id_departamento/:id_municipio` | Si | Consultar estaciones |
| `POST` | `/crg/estacioncarga/:id/:id_operador/:id_departamento/:id_municipio` | Si | Crear estacion |
| `PUT` | `/crg/estacioncarga/:id/:id_operador/:id_departamento/:id_municipio` | Si | Actualizar estacion |
| `DELETE` | `/crg/estacioncarga/:id/:id_operador/:id_departamento/:id_municipio` | Si | Eliminar estacion |
| `POST` | `/crg/twinestacioncarga/:id/:id_operador` | Si | Twin digital estacion |
| `POST` | `/crg/twinpuntocarga/:id/:id_operador` | Si | Twin digital punto carga |
| `POST` | `/crg/estacionmasivo/:id_operador` | Si | Carga masiva estaciones |
| `GET` | `/crg/puntocarga/:id/:id_estacion` | Si | Consultar puntos de carga |
| `POST` | `/crg/puntocarga/:id/:id_estacion` | Si | Crear punto de carga |
| `PUT` | `/crg/puntocarga/:id/:id_estacion` | Si | Actualizar punto de carga |
| `DELETE` | `/crg/puntocarga/:id/:id_estacion` | Si | Eliminar punto de carga |
| `GET` | `/crg/conectorcarga/:id/:id_punto/:id_estacion` | Si | Consultar conectores |
| `POST` | `/crg/conectorcarga/:id/:id_punto/:id_estacion` | Si | Crear conector |
| `PUT` | `/crg/conectorcarga/:id/:id_punto/:id_estacion` | Si | Actualizar conector |
| `DELETE` | `/crg/conectorcarga/:id/:id_punto/:id_estacion` | Si | Eliminar conector |
| `GET` | `/crg/filtrosbuscar/:id/:nombre` | Si | Filtros de busqueda |
| `GET` | `/crg/resumenestacionescarga/:id/:id_operador/:id_departamento/:id_municipio` | Si | **Resumen estaciones** |

---

## 4. Convencion de Parametros en URLs

Patron general: `/crg/<recurso>/:id/:filtro1/:filtro2/...`

- `:id` = `0` significa **todos** (sin filtro)
- Parametros opcionales marcados con `?` en la documentacion
- Los parametros van en la **URL** (path params), no en query string

### Ejemplo del curl de produccion:
```
/crg/resumenestacionescarga/0/0/0/11001/?
                            │ │ │ │
                            │ │ │ └── id_municipio (11001 = Bogota)
                            │ │ └──── id_departamento (0 = todos)
                            │ └────── id_operador (0 = todos)
                            └──────── id (0 = todos)
```

---

## 5. Endpoints Prioritarios para UPME

Para la integracion UPME, los endpoints mas relevantes son (en orden de prioridad):

### Prioridad 1 — Datos de Estaciones (core de la integracion)
1. `GET /crg/resumenestacionescarga/:id/:id_operador/:id_departamento/:id_municipio` — **Resumen completo**
2. `GET /crg/estacioncarga/:id/:id_operador/:id_departamento/:id_municipio` — **Detalle estaciones**
3. `GET /crg/puntocarga/:id/:id_estacion` — **Puntos de carga por estacion**
4. `GET /crg/conectorcarga/:id/:id_punto/:id_estacion` — **Conectores por punto**
5. `GET /crg/estacionoperador/:id/:id_operador/:id_departamento/:id_municipio` — **Estaciones por operador**

### Prioridad 2 — Datos de Operadores (CPOs)
6. `GET /crg/operador/:id` — **Listado de operadores**
7. `GET /crg/tipo_operador/:id` — **Tipos de operador**
8. `GET /crg/contactoop/:id/:id_operador/:tipo_identificacion/:nro_identificacion` — **Contactos**

### Prioridad 3 — Catalogos (referencia)
9. `GET /crg/departamento/:id` — Departamentos
10. `GET /crg/municipio/:id/:id_departamento` — Municipios
11. `GET /crg/tipoubicacion/:id` — Tipos de ubicacion
12. `GET /crg/tipoestacion/:id` — Tipos de estacion
13. `GET /crg/tipoestandar/:id/:nombre` — Tipos de estandar (conectores)
14. `GET /crg/modelotarifa/:id` — Modelos de tarifa

---

## 6. Hallazgos de Seguridad

| Hallazgo | Severidad | Detalle |
|----------|-----------|---------|
| Token sin expiracion | **Alta** | El token de servicio no tiene `exp`, nunca expira |
| Token emitido en 2020 | **Alta** | `iat: 1594849631` = Jul 2020, nunca rotado |
| HS256 (secret compartido) | **Media** | Vulnerable si el secret se filtra; no hay verificacion asimetrica |
| Auth header minuscula | **Baja** | Usa `authorization` sin "Bearer", no-estandar |
| Puerto no-estandar | **Info** | HTTPS en puerto 3011, puede causar problemas con firewalls |
| Sin rate limiting visible | **Media** | No hay headers de rate limiting en las respuestas |
| Endpoints publicos sin auth | **Info** | Catalogos (departamento, municipio, etc.) son publicos |

---

## 7. Notas para Integracion UPME

1. **No tenemos credenciales propias** — Se necesita solicitar usuario/password a MinEnergia/Cargame
2. **El token del curl prod funciona** — Es un token de servicio PowerBI que podemos usar para pruebas GET
3. **Los endpoints publicos no requieren token** — departamento, municipio, etc.
4. **Los endpoints de estaciones SI requieren token** — Necesitamos auth para los datos core
5. **Patron de IDs:** `0` = todos los registros (wildcard)
6. **CORS configurado** — Origin permitido: `https://cargame.minenergia.gov.co`

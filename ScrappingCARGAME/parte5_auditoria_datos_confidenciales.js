#!/usr/bin/env node
/**
 * PARTE 5: Auditoría de Datos Confidenciales Expuestos
 * 
 * Analiza campo por campo CADA API para identificar:
 *   - PII (Personally Identifiable Information)
 *   - Datos sensibles de negocio
 *   - Credenciales expuestas
 *   - Violaciones a Ley 1581 de 2012 (Colombia)
 *   - Violaciones OWASP API Security Top 10 (2023)
 *   - Brechas ISO 27001
 *
 * Genera un informe HTML dedicado a seguridad y confidencialidad.
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;

function loadJSON(f) {
  const p = path.join(DIR, f);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

// ═══ Cargar todos los datos ════════════════════════════════════
const operadores = loadJSON('descubierto_crg_operador.json');
const usuarios = loadJSON('descubierto_crg_usuario.json');
const consentimientos = loadJSON('descubierto_crg_consentimiento.json');
const estaciones = loadJSON('data_estaciones_completas.json');

// ═══ CLASIFICACIÓN DE CAMPOS POR SENSIBILIDAD ═════════════════
// Categorías: CRITICO, ALTO, MEDIO, BAJO, PUBLICO

function analyzeEndpoint(name, endpoint, data, fieldAnalysis) {
  return {
    endpoint: name,
    url: endpoint,
    totalRegistros: Array.isArray(data) ? data.length : 0,
    campos: fieldAnalysis
  };
}

// ═══ 1. ANÁLISIS: /crg/operador ═══════════════════════════════
function analyzeOperadores() {
  if (!operadores) return null;
  
  const camposExpuestos = [
    {
      campo: 'Id',
      tipo: 'Integer',
      ejemplo: operadores[5]?.Id ?? 'N/A',
      clasificacion: 'BAJO',
      esPII: false,
      descripcion: 'Identificador interno del operador',
      riesgo: 'Puede usarse para enumerar registros',
      ley1581: 'No aplica',
      owasp: 'API1:2023 - Broken Object Level Authorization'
    },
    {
      campo: 'Nombres',
      tipo: 'String',
      ejemplo: operadores[5]?.Nombres ?? 'N/A',
      clasificacion: 'MEDIO',
      esPII: true,
      descripcion: 'Razón social o nombre completo del operador',
      riesgo: 'Dato público en registros mercantiles, pero su exposición masiva facilita ingeniería social',
      ley1581: 'Dato semiprivado (Art. 3, Ley 1581)',
      owasp: 'API3:2023 - Broken Object Property Level Authorization'
    },
    {
      campo: 'Nroidentificacion (NIT/CC)',
      tipo: 'String',
      ejemplo: operadores[5]?.Nroidentificacion ?? 'N/A',
      clasificacion: 'ALTO',
      esPII: true,
      descripcion: 'Número de identificación tributaria o cédula del operador',
      riesgo: 'Permite suplantación de identidad, fraude tributario, verificación no autorizada',
      ley1581: 'Dato privado (Art. 3, Ley 1581) — requiere autorización del titular',
      owasp: 'API3:2023 - Broken Object Property Level Authorization'
    },
    {
      campo: 'Tipoidentificacion',
      tipo: 'Object',
      ejemplo: operadores[5]?.Tipoidentificacion?.NombreIdentificacion ?? 'N/A',
      clasificacion: 'BAJO',
      esPII: false,
      descripcion: 'Tipo de documento (NIT, CC, CE, etc.)',
      riesgo: 'Complementa el NIT para suplantación',
      ley1581: 'Dato semiprivado',
      owasp: 'N/A'
    },
    {
      campo: 'Correo',
      tipo: 'String',
      ejemplo: operadores[5]?.Correo ?? 'N/A',
      clasificacion: 'ALTO',
      esPII: true,
      descripcion: 'Correo electrónico de contacto del operador',
      riesgo: 'Phishing dirigido, spam, ingeniería social, correlación de identidades',
      ley1581: 'Dato privado (Art. 3, Ley 1581) — requiere autorización',
      owasp: 'API3:2023 - Broken Object Property Level Authorization'
    },
    {
      campo: 'Celular',
      tipo: 'String',
      ejemplo: operadores[5]?.Celular ?? 'N/A',
      clasificacion: 'ALTO',
      esPII: true,
      descripcion: 'Número de celular del operador/representante',
      riesgo: 'SIM swapping, vishing, acoso, rastreo de personas',
      ley1581: 'Dato privado (Art. 3, Ley 1581) — requiere autorización',
      owasp: 'API3:2023 - Broken Object Property Level Authorization'
    },
    {
      campo: 'Telefonofijo',
      tipo: 'String',
      ejemplo: operadores[5]?.Telefonofijo ?? 'N/A',
      clasificacion: 'MEDIO',
      esPII: true,
      descripcion: 'Teléfono fijo del operador',
      riesgo: 'Contacto no autorizado',
      ley1581: 'Dato semiprivado',
      owasp: 'API3:2023'
    },
    {
      campo: 'Direccion',
      tipo: 'String',
      ejemplo: operadores[5]?.Direccion ?? 'N/A',
      clasificacion: 'ALTO',
      esPII: true,
      descripcion: 'Dirección física del operador',
      riesgo: 'Ubicación de personas/empresas, acoso, robo dirigido',
      ley1581: 'Dato privado (Art. 3, Ley 1581)',
      owasp: 'API3:2023'
    },
    {
      campo: 'Indicativo',
      tipo: 'String',
      ejemplo: operadores[5]?.Indicativo ?? 'N/A',
      clasificacion: 'BAJO',
      esPII: false,
      descripcion: 'Indicativo telefónico',
      riesgo: 'Bajo',
      ley1581: 'No aplica',
      owasp: 'N/A'
    },
    {
      campo: 'Siglas',
      tipo: 'String',
      ejemplo: operadores[5]?.Siglas ?? 'N/A',
      clasificacion: 'PUBLICO',
      esPII: false,
      descripcion: 'Siglas del operador',
      riesgo: 'Dato público',
      ley1581: 'Dato público',
      owasp: 'N/A'
    },
    {
      campo: 'Tipooperador',
      tipo: 'Object',
      ejemplo: operadores[5]?.Tipooperador?.TipoOperador ?? 'N/A',
      clasificacion: 'PUBLICO',
      esPII: false,
      descripcion: 'Clasificación del operador (Convencional/No convencional)',
      riesgo: 'Dato público',
      ley1581: 'Dato público',
      owasp: 'N/A'
    },
    {
      campo: 'Estadooperador',
      tipo: 'Object',
      ejemplo: operadores[5]?.Estadooperador?.NombreEstado ?? 'N/A',
      clasificacion: 'BAJO',
      esPII: false,
      descripcion: 'Estado del registro (Activo/Inactivo)',
      riesgo: 'Información de negocio',
      ley1581: 'Dato semiprivado',
      owasp: 'N/A'
    },
    {
      campo: 'Departamento / Municipio',
      tipo: 'Object',
      ejemplo: `${operadores[5]?.Departamento?.NombreDepartamento ?? 'N/A'} / ${operadores[5]?.Municipio?.NombreMunicipio ?? 'N/A'}`,
      clasificacion: 'BAJO',
      esPII: false,
      descripcion: 'Ubicación geográfica general',
      riesgo: 'Dato público',
      ley1581: 'Dato público',
      owasp: 'N/A'
    },
    {
      campo: 'Tipopersona',
      tipo: 'Object',
      ejemplo: operadores[5]?.Tipopersona?.Nombre ?? 'N/A',
      clasificacion: 'BAJO',
      esPII: false,
      descripcion: 'Natural o Jurídica',
      riesgo: 'Bajo',
      ley1581: 'Dato semiprivado',
      owasp: 'N/A'
    },
    {
      campo: 'Sitio',
      tipo: 'String',
      ejemplo: operadores[5]?.Sitio ?? 'N/A',
      clasificacion: 'PUBLICO',
      esPII: false,
      descripcion: 'Sitio web del operador',
      riesgo: 'Dato público',
      ley1581: 'Dato público',
      owasp: 'N/A'
    },
    {
      campo: 'Fechacreacion',
      tipo: 'Date',
      ejemplo: operadores[5]?.Fechacreacion ?? 'N/A',
      clasificacion: 'BAJO',
      esPII: false,
      descripcion: 'Fecha de registro en la plataforma',
      riesgo: 'Información operativa interna',
      ley1581: 'No aplica',
      owasp: 'N/A'
    },
    {
      campo: 'Files',
      tipo: 'String/Object',
      ejemplo: operadores[5]?.Files ? 'Tiene archivos' : 'Sin archivos',
      clasificacion: 'MEDIO',
      esPII: false,
      descripcion: 'Referencia a archivos adjuntos del operador',
      riesgo: 'Posible exposición de documentos legales',
      ley1581: 'Depende del contenido',
      owasp: 'API3:2023'
    }
  ];

  // Contar datos reales expuestos
  let totalCorreos = 0, totalCelulares = 0, totalNITs = 0, totalDirecciones = 0;
  operadores.forEach(op => {
    if (op.Correo && op.Correo.trim()) totalCorreos++;
    if (op.Celular && op.Celular.trim() && op.Celular !== '0') totalCelulares++;
    if (op.Nroidentificacion && op.Nroidentificacion.trim()) totalNITs++;
    if (op.Direccion && op.Direccion.trim()) totalDirecciones++;
  });

  return {
    ...analyzeEndpoint('/crg/operador', 'GET https://siveeic.minenergia.gov.co:3011/crg/operador', operadores, camposExpuestos),
    datosRealesExpuestos: {
      totalRegistros: operadores.length,
      correos: totalCorreos,
      celulares: totalCelulares,
      NITs: totalNITs,
      direcciones: totalDirecciones
    },
    muestraDatosReales: operadores.filter(op => op.Correo && op.Correo.trim() && op.Id > 2).slice(0, 10).map(op => ({
      Id: op.Id,
      Nombre: op.Nombres,
      NIT: op.Nroidentificacion,
      Correo: op.Correo,
      Celular: op.Celular,
      Direccion: op.Direccion,
      Estado: op.Estadooperador?.NombreEstado
    }))
  };
}

// ═══ 2. ANÁLISIS: /crg/usuario ════════════════════════════════
function analyzeUsuarios() {
  if (!usuarios) return null;

  const camposExpuestos = [
    {
      campo: 'Id',
      tipo: 'Integer',
      ejemplo: usuarios[2]?.Id ?? 'N/A',
      clasificacion: 'BAJO',
      esPII: false,
      descripcion: 'ID interno',
      riesgo: 'Enumeración',
      ley1581: 'No aplica',
      owasp: 'API1:2023'
    },
    {
      campo: 'Nombres + Apellidos',
      tipo: 'String',
      ejemplo: `${usuarios[2]?.Nombres ?? ''} ${usuarios[2]?.Apellidos ?? ''}`.trim(),
      clasificacion: 'ALTO',
      esPII: true,
      descripcion: 'Nombre completo del usuario',
      riesgo: 'Identificación directa de personas, ingeniería social',
      ley1581: 'Dato privado (Art. 3, Ley 1581)',
      owasp: 'API3:2023'
    },
    {
      campo: 'Nroidentificacion (CC/NIT)',
      tipo: 'String',
      ejemplo: usuarios[2]?.Nroidentificacion ?? 'N/A',
      clasificacion: 'CRITICO',
      esPII: true,
      descripcion: 'Número de cédula de ciudadanía o NIT',
      riesgo: 'Suplantación de identidad, fraude, acceso a otros sistemas gubernamentales',
      ley1581: 'Dato privado — Clasificado como SENSIBLE por ser documento de identidad',
      owasp: 'API3:2023 - Broken Object Property Level Authorization'
    },
    {
      campo: 'Usuario',
      tipo: 'String',
      ejemplo: usuarios[2]?.Usuario ?? 'N/A',
      clasificacion: 'ALTO',
      esPII: true,
      descripcion: 'Nombre de usuario para login (frecuentemente es la CC o NIT)',
      riesgo: 'Enumeración de usuarios, credential stuffing',
      ley1581: 'Dato privado',
      owasp: 'API2:2023 - Broken Authentication'
    },
    {
      campo: 'Clave (hash bcrypt)',
      tipo: 'String',
      ejemplo: '$2b$10$XXXX...XXXX (hash bcrypt completo expuesto)',
      clasificacion: 'CRITICO',
      esPII: false,
      descripcion: 'Hash bcrypt de la contraseña del usuario',
      riesgo: 'Ataques de fuerza bruta offline, rainbow tables adaptadas, credential reuse si la contraseña es débil',
      ley1581: 'Dato sensible — VIOLACIÓN DIRECTA Art. 5 y Art. 17 Ley 1581',
      owasp: 'API2:2023 - Broken Authentication + API3:2023'
    },
    {
      campo: 'Tipousuario',
      tipo: 'Object',
      ejemplo: usuarios[2]?.Tipousuario?.NombreTipo ?? 'N/A',
      clasificacion: 'MEDIO',
      esPII: false,
      descripcion: 'Rol y tipo de acceso del usuario',
      riesgo: 'Mapeo de roles y privilegios, escalamiento de privilegios',
      ley1581: 'Dato operativo',
      owasp: 'API5:2023 - Broken Function Level Authorization'
    },
    {
      campo: 'Correo',
      tipo: 'String',
      ejemplo: usuarios[2]?.Correo ?? 'N/A',
      clasificacion: 'ALTO',
      esPII: true,
      descripcion: 'Correo electrónico del usuario',
      riesgo: 'Phishing dirigido, spam, correlación con otras bases de datos',
      ley1581: 'Dato privado (Art. 3)',
      owasp: 'API3:2023'
    },
    {
      campo: 'Celular',
      tipo: 'String',
      ejemplo: usuarios[2]?.Celular ?? 'N/A',
      clasificacion: 'ALTO',
      esPII: true,
      descripcion: 'Número celular del usuario',
      riesgo: 'SIM swapping, vishing, acoso',
      ley1581: 'Dato privado (Art. 3)',
      owasp: 'API3:2023'
    },
    {
      campo: 'Fechaexpira',
      tipo: 'Date',
      ejemplo: usuarios[2]?.Fechaexpira ?? 'N/A',
      clasificacion: 'MEDIO',
      esPII: false,
      descripcion: 'Fecha de expiración de la cuenta',
      riesgo: 'Permite identificar cuentas próximas a vencer para ataque',
      ley1581: 'Dato operativo',
      owasp: 'API8:2023 - Security Misconfiguration'
    },
    {
      campo: 'Coordinacionoperativa',
      tipo: 'Object',
      ejemplo: usuarios[2]?.Coordinacionoperativa?.Coordinacionoperativa ?? 'N/A',
      clasificacion: 'BAJO',
      esPII: false,
      descripcion: 'Operador asociado al usuario',
      riesgo: 'Mapeo usuario-operador',
      ley1581: 'Dato operativo',
      owasp: 'N/A'
    }
  ];

  let totalClaves = 0, totalCorreos = 0, totalCedulas = 0, totalAdmin = 0;
  const tiposUsuario = {};
  usuarios.forEach(u => {
    if (u.Clave) totalClaves++;
    if (u.Correo && u.Correo.includes('@')) totalCorreos++;
    if (u.Nroidentificacion) totalCedulas++;
    if (u.Tipousuario?.NombreTipo === 'Administrador') totalAdmin++;
    const t = u.Tipousuario?.NombreTipo || 'Sin tipo';
    tiposUsuario[t] = (tiposUsuario[t] || 0) + 1;
  });

  return {
    ...analyzeEndpoint('/crg/usuario', 'GET https://siveeic.minenergia.gov.co:3011/crg/usuario', usuarios, camposExpuestos),
    datosRealesExpuestos: {
      totalRegistros: usuarios.length,
      hashesContraseña: totalClaves,
      correosElectronicos: totalCorreos,
      cedulasNITs: totalCedulas,
      cuentasAdmin: totalAdmin,
      tiposUsuario
    }
  };
}

// ═══ 3. ANÁLISIS: /crg/resumenestacionescarga ═════════════════
function analyzeEstaciones() {
  if (!estaciones) return null;
  
  const camposExpuestos = [
    { campo: 'Id (UUID)', clasificacion: 'BAJO', esPII: false, descripcion: 'UUID de la estación', riesgo: 'Enumeración', ley1581: 'N/A', owasp: 'API1:2023' },
    { campo: 'Operador.Id + Nombreempresa', clasificacion: 'PUBLICO', esPII: false, descripcion: 'Nombre del operador dueño', riesgo: 'Dato público', ley1581: 'Dato público', owasp: 'N/A' },
    { campo: 'Nombre', clasificacion: 'PUBLICO', esPII: false, descripcion: 'Nombre de la estación', riesgo: 'Dato público', ley1581: 'Dato público', owasp: 'N/A' },
    { campo: 'Direccion', clasificacion: 'PUBLICO', esPII: false, descripcion: 'Dirección de la estación (ubicación de negocio)', riesgo: 'Dato público', ley1581: 'Dato público', owasp: 'N/A' },
    { campo: 'Latitud / Longitud', clasificacion: 'PUBLICO', esPII: false, descripcion: 'Coordenadas GPS', riesgo: 'Dato público (mapa)', ley1581: 'Dato público', owasp: 'N/A' },
    { campo: 'Conectores / PotenciaMax', clasificacion: 'PUBLICO', esPII: false, descripcion: 'Especificaciones técnicas', riesgo: 'Dato público', ley1581: 'Dato público', owasp: 'N/A' },
    { campo: 'Cobros / Precios', clasificacion: 'MEDIO', esPII: false, descripcion: 'Información comercial de tarifas', riesgo: 'Dato comercial — podría ser confidencial para el operador', ley1581: 'Dato semiprivado', owasp: 'API3:2023' },
    { campo: 'Files (foto, cumplimiento, conformidad)', clasificacion: 'MEDIO', esPII: false, descripcion: 'URLs de documentos legales y certificados', riesgo: 'Acceso a documentos legales sin autorización', ley1581: 'Depende del contenido', owasp: 'API3:2023' },
    { campo: 'Observacion', clasificacion: 'BAJO', esPII: false, descripcion: 'Notas del operador', riesgo: 'Puede contener info sensible', ley1581: 'N/A', owasp: 'N/A' }
  ];

  return analyzeEndpoint('/crg/resumenestacionescarga/0/0', 'GET https://siveeic.minenergia.gov.co:3011/crg/resumenestacionescarga/0/0', estaciones, camposExpuestos);
}

// ═══ 4. ANÁLISIS: /crg/consentimiento ═════════════════════════
function analyzeConsentimiento() {
  if (!consentimientos) return null;
  
  const camposExpuestos = [
    { campo: 'id_tratamiento', clasificacion: 'BAJO', esPII: false, descripcion: 'ID del consentimiento', riesgo: 'Enumeración', ley1581: 'N/A', owasp: 'API1:2023' },
    { campo: 'Operador (ID)', clasificacion: 'MEDIO', esPII: false, descripcion: 'ID del operador que dio consentimiento', riesgo: 'Mapeo operador-consentimiento', ley1581: 'Dato sensible (Art. 6)', owasp: 'API3:2023' },
    { campo: 'Usuario (ID)', clasificacion: 'MEDIO', esPII: true, descripcion: 'ID del usuario asociado', riesgo: 'Correlación con endpoint /crg/usuario', ley1581: 'Dato sensible — revela decisión de tratamiento de datos', owasp: 'API3:2023' },
    { campo: 'Autorizo', clasificacion: 'ALTO', esPII: true, descripcion: 'Si autorizó o no el tratamiento de datos', riesgo: 'Dato protegido por Ley 1581 — la decisión de consentimiento es SENSIBLE', ley1581: 'VIOLACIÓN Art. 6 y Art. 9 Ley 1581 — consentimiento es dato sensible', owasp: 'API3:2023' },
    { campo: 'Fecha', clasificacion: 'BAJO', esPII: false, descripcion: 'Fecha del consentimiento', riesgo: 'Bajo', ley1581: 'N/A', owasp: 'N/A' }
  ];

  return analyzeEndpoint('/crg/consentimiento', 'GET https://siveeic.minenergia.gov.co:3011/crg/consentimiento', consentimientos, camposExpuestos);
}

// ═══ COMPILAR AUDITORÍA COMPLETA ══════════════════════════════
function compilarAuditoria() {
  const opAnalisis = analyzeOperadores();
  const usrAnalisis = analyzeUsuarios();
  const estAnalisis = analyzeEstaciones();
  const consAnalisis = analyzeConsentimiento();

  // ═══ OWASP API Security Top 10 (2023) Assessment ═══
  const owaspAssessment = [
    {
      id: 'API1:2023',
      nombre: 'Broken Object Level Authorization (BOLA)',
      estado: 'VIOLADO',
      severidad: 'CRITICA',
      evidencia: 'Todos los endpoints devuelven TODOS los registros sin filtro por usuario autenticado. El token JWT tiene rol "intelligence" con acceso total.',
      recomendacion: 'Implementar control de acceso por objeto. Cada usuario solo debe ver sus propios datos o datos autorizados.'
    },
    {
      id: 'API2:2023',
      nombre: 'Broken Authentication',
      estado: 'VIOLADO',
      severidad: 'CRITICA',
      evidencia: 'Token JWT estático (emitido 2020-07-16, sin expiración), hardcodeado en el frontend. Hashes bcrypt de 272 usuarios expuestos vía API. No hay rotación de tokens.',
      recomendacion: 'Implementar OAuth2/OIDC con tokens de corta duración. Nunca exponer hashes de contraseñas. Rotación periódica de secretos.'
    },
    {
      id: 'API3:2023',
      nombre: 'Broken Object Property Level Authorization',
      estado: 'VIOLADO',
      severidad: 'CRITICA',
      evidencia: 'Las APIs devuelven TODOS los campos de cada objeto sin filtrar campos sensibles. Ejemplo: /crg/usuario devuelve el campo "Clave" (hash), /crg/operador devuelve correos, celulares, direcciones.',
      recomendacion: 'Implementar DTOs/ViewModels que solo expongan campos necesarios. Nunca incluir hashes, datos de contacto privados ni campos internos en respuestas públicas.'
    },
    {
      id: 'API4:2023',
      nombre: 'Unrestricted Resource Consumption',
      estado: 'PROBABLE',
      severidad: 'ALTA',
      evidencia: 'No se detectaron headers de rate limiting. Las APIs devuelven datasets completos sin paginación (194 operadores, 272 usuarios, 1122 municipios en una sola respuesta).',
      recomendacion: 'Implementar rate limiting, paginación obligatoria, y límites de tamaño de respuesta.'
    },
    {
      id: 'API5:2023',
      nombre: 'Broken Function Level Authorization',
      estado: 'VIOLADO',
      severidad: 'ALTA',
      evidencia: 'Un token con rol "intelligence" (lectura/BI) tiene acceso a endpoints administrativos como /crg/usuario que expone datos de administradores.',
      recomendacion: 'Implementar RBAC granular. Separar endpoints públicos, operador, administrador.'
    },
    {
      id: 'API6:2023',
      nombre: 'Unrestricted Access to Sensitive Business Flows',
      estado: 'PROBABLE',
      severidad: 'MEDIA',
      evidencia: 'Se pueden descargar todas las estaciones, operadores y filtros para replicar la base de datos completa.',
      recomendacion: 'Implementar anti-scraping, CAPTCHA en endpoints sensibles.'
    },
    {
      id: 'API7:2023',
      nombre: 'Server Side Request Forgery (SSRF)',
      estado: 'NO EVALUADO',
      severidad: '-',
      evidencia: 'No se probaron endpoints POST/PUT.',
      recomendacion: 'Evaluar con pruebas de penetración.'
    },
    {
      id: 'API8:2023',
      nombre: 'Security Misconfiguration',
      estado: 'VIOLADO',
      severidad: 'ALTA',
      evidencia: 'CORS permisivo (cualquier origen), JWT hardcodeado sin expiración, servidor en puerto no estándar (3011), no se observan headers de seguridad (CSP, HSTS, X-Content-Type).',
      recomendacion: 'Configurar CORS restrictivo, headers de seguridad, HTTPS con HSTS, secretos en variables de entorno.'
    },
    {
      id: 'API9:2023',
      nombre: 'Improper Inventory Management',
      estado: 'VIOLADO',
      severidad: 'MEDIA',
      evidencia: 'Endpoints no documentados descubiertos por enumeración simple (/crg/operador, /crg/usuario, /crg/consentimiento). No hay documentación pública de API.',
      recomendacion: 'Documentar todas las APIs (OpenAPI/Swagger), implementar API Gateway con inventario.'
    },
    {
      id: 'API10:2023',
      nombre: 'Unsafe Consumption of APIs',
      estado: 'NO EVALUADO',
      severidad: '-',
      evidencia: 'N/A — No aplica en este contexto de consumo.',
      recomendacion: 'N/A'
    }
  ];

  // ═══ LEY 1581 de 2012 Assessment ═══
  const ley1581Assessment = [
    {
      articulo: 'Art. 3 — Definiciones',
      tipo: 'Dato privado / Dato sensible',
      estado: 'VIOLADO',
      detalle: 'Se exponen datos privados (NIT, CC, correo, celular, dirección) y datos sensibles (hashes de contraseña) sin autorización del titular.'
    },
    {
      articulo: 'Art. 4 — Principio de finalidad',
      tipo: 'Finalidad del tratamiento',
      estado: 'VIOLADO',
      detalle: 'Los datos se exponen más allá de la finalidad del sistema (registro de estaciones). No hay necesidad de exponer celulares, correos y contraseñas de operadores al público.'
    },
    {
      articulo: 'Art. 4 — Principio de necesidad',
      tipo: 'Minimización de datos',
      estado: 'VIOLADO',
      detalle: 'Las APIs devuelven TODOS los campos sin filtrar. No se aplica el principio de mínimo dato necesario.'
    },
    {
      articulo: 'Art. 4 — Principio de seguridad',
      tipo: 'Medidas de seguridad',
      estado: 'VIOLADO',
      detalle: 'Token JWT estático sin expiración, sin CORS restrictivo, sin rate limiting. Los hashes de contraseña están expuestos.'
    },
    {
      articulo: 'Art. 4 — Principio de confidencialidad',
      tipo: 'Confidencialidad',
      estado: 'VIOLADO',
      detalle: 'Datos que deben ser confidenciales (contraseñas, datos de contacto privados) son accesibles públicamente.'
    },
    {
      articulo: 'Art. 5 — Datos sensibles',
      tipo: 'Tratamiento de datos sensibles',
      estado: 'VIOLADO',
      detalle: 'Los hashes de contraseña y datos de consentimiento son datos sensibles que requieren protección especial.'
    },
    {
      articulo: 'Art. 6 — Autorización',
      tipo: 'Consentimiento del titular',
      estado: 'CUESTIONABLE',
      detalle: 'No es verificable si los operadores autorizaron que sus datos de contacto (correo, celular, dirección) fueran expuestos públicamente vía API.'
    },
    {
      articulo: 'Art. 9 — Autorización datos sensibles',
      tipo: 'Autorización especial',
      estado: 'VIOLADO',
      detalle: 'El endpoint /crg/consentimiento expone las decisiones de autorización de tratamiento de datos, que son datos sensibles.'
    },
    {
      articulo: 'Art. 12 — Deberes del responsable',
      tipo: 'Deberes del responsable',
      estado: 'VIOLADO',
      detalle: 'El responsable (MinEnergía) debe garantizar la seguridad de los datos. La exposición pública sin control viola este deber.'
    },
    {
      articulo: 'Art. 17 — Deberes del encargado',
      tipo: 'Medidas técnicas',
      estado: 'VIOLADO',
      detalle: 'El encargado debe implementar medidas técnicas para proteger los datos. El JWT estático y la falta de autenticación real violan esto.'
    }
  ];

  // ═══ ISO 27001 Domains ═══
  const iso27001Assessment = [
    { control: 'A.8.2 — Clasificación de la información', estado: 'NO CONFORME', detalle: 'No hay evidencia de clasificación de datos. Datos públicos, privados y sensibles se mezclan en las mismas respuestas API sin distinción.' },
    { control: 'A.9.1 — Control de acceso', estado: 'NO CONFORME', detalle: 'Token JWT estático sin autenticación real. Sin RBAC funcional. Sin MFA.' },
    { control: 'A.9.4 — Control de acceso a sistemas', estado: 'NO CONFORME', detalle: 'Hashes de contraseña expuestos. Usuarios y roles enumerables.' },
    { control: 'A.10.1 — Controles criptográficos', estado: 'PARCIAL', detalle: 'Se usa bcrypt para hashes (bien), pero se exponen los hashes vía API (mal). JWT usa HS256 (simétrico) en lugar de RS256 (asimétrico).' },
    { control: 'A.12.6 — Gestión de vulnerabilidades', estado: 'NO CONFORME', detalle: 'Las vulnerabilidades descritas han estado presentes desde al menos 2020 (fecha del JWT).' },
    { control: 'A.14.1 — Seguridad en desarrollo', estado: 'NO CONFORME', detalle: 'Secretos hardcodeados en frontend, sin API Gateway, sin documentación de seguridad.' },
    { control: 'A.18.1 — Cumplimiento legal', estado: 'NO CONFORME', detalle: 'Violaciones a Ley 1581 de 2012 (Protección de Datos) identificadas.' }
  ];

  return {
    fecha: new Date().toISOString(),
    plataforma: 'CARGAME — Ministerio de Minas y Energía de Colombia',
    url: 'https://cargame.minenergia.gov.co',
    backend: 'https://siveeic.minenergia.gov.co:3011/crg/',
    endpointsAnalizados: [opAnalisis, usrAnalisis, estAnalisis, consAnalisis].filter(Boolean),
    owaspAssessment,
    ley1581Assessment,
    iso27001Assessment,
    resumen: {
      totalEndpoints: 14,
      totalCamposSensibles: 0, // se calcula abajo
      totalPII: 0,
      totalCriticos: 0,
      totalAltos: 0,
      totalMedios: 0,
      owaspViolados: owaspAssessment.filter(o => o.estado === 'VIOLADO').length,
      ley1581Violados: ley1581Assessment.filter(l => l.estado === 'VIOLADO').length,
      iso27001NoConforme: iso27001Assessment.filter(i => i.estado === 'NO CONFORME').length
    }
  };
}

// ═══ MAIN ═══
function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  PARTE 5: Auditoría de Datos Confidenciales');
  console.log('  Plataforma CARGAME — MinEnergía Colombia');
  console.log('═══════════════════════════════════════════════════════');

  const auditoria = compilarAuditoria();

  // Calcular resumen
  let totalPII = 0, totalCrit = 0, totalAlto = 0, totalMedio = 0;
  auditoria.endpointsAnalizados.forEach(ep => {
    ep.campos.forEach(c => {
      if (c.esPII) totalPII++;
      if (c.clasificacion === 'CRITICO') totalCrit++;
      if (c.clasificacion === 'ALTO') totalAlto++;
      if (c.clasificacion === 'MEDIO') totalMedio++;
    });
  });
  auditoria.resumen.totalPII = totalPII;
  auditoria.resumen.totalCriticos = totalCrit;
  auditoria.resumen.totalAltos = totalAlto;
  auditoria.resumen.totalMedios = totalMedio;
  auditoria.resumen.totalCamposSensibles = totalCrit + totalAlto;

  fs.writeFileSync(path.join(DIR, 'auditoria_datos_confidenciales.json'), JSON.stringify(auditoria, null, 2), 'utf8');
  console.log('   💾 auditoria_datos_confidenciales.json');

  // ═══ Imprimir resumen ═══
  console.log('\n━━━ RESUMEN DE AUDITORÍA ━━━');
  console.log(`\n   📊 Campos analizados:`);
  console.log(`      🔴 CRÍTICOS: ${totalCrit} campos`);
  console.log(`      🟠 ALTOS:    ${totalAlto} campos`);
  console.log(`      🟡 MEDIOS:   ${totalMedio} campos`);
  console.log(`      🔵 PII:      ${totalPII} campos contienen datos personales`);

  console.log(`\n   🛡️  OWASP API Top 10 (2023):`);
  auditoria.owaspAssessment.forEach(o => {
    const icon = o.estado === 'VIOLADO' ? '🔴' : o.estado === 'PROBABLE' ? '🟠' : '⚪';
    console.log(`      ${icon} ${o.id} ${o.nombre}: ${o.estado}`);
  });

  console.log(`\n   📜 Ley 1581 de 2012 (Colombia):`);
  auditoria.ley1581Assessment.forEach(l => {
    const icon = l.estado === 'VIOLADO' ? '🔴' : l.estado === 'CUESTIONABLE' ? '🟡' : '✅';
    console.log(`      ${icon} ${l.articulo}: ${l.estado}`);
  });

  console.log(`\n   🏛️  ISO 27001:`);
  auditoria.iso27001Assessment.forEach(i => {
    const icon = i.estado === 'NO CONFORME' ? '🔴' : i.estado === 'PARCIAL' ? '🟡' : '✅';
    console.log(`      ${icon} ${i.control}: ${i.estado}`);
  });

  // ═══ Datos reales expuestos ═══
  const opData = auditoria.endpointsAnalizados.find(e => e.endpoint === '/crg/operador');
  if (opData?.datosRealesExpuestos) {
    console.log(`\n━━━ DATOS REALES DE PRESTADORES EXPUESTOS ━━━`);
    const d = opData.datosRealesExpuestos;
    console.log(`   Total operadores: ${d.totalRegistros}`);
    console.log(`   📧 Correos expuestos: ${d.correos}`);
    console.log(`   📱 Celulares expuestos: ${d.celulares}`);
    console.log(`   🆔 NITs expuestos: ${d.NITs}`);
    console.log(`   📍 Direcciones expuestas: ${d.direcciones}`);
  }

  if (opData?.muestraDatosReales) {
    console.log(`\n   Muestra de datos REALES expuestos (10 de ${opData.datosRealesExpuestos.totalRegistros}):`);
    console.log('   ┌────┬──────────────────────────────────────┬──────────────┬─────────────────────────────────┬──────────────┐');
    console.log('   │ ID │ Operador                             │ NIT          │ Correo                          │ Celular      │');
    console.log('   ├────┼──────────────────────────────────────┼──────────────┼─────────────────────────────────┼──────────────┤');
    opData.muestraDatosReales.forEach(op => {
      const id = String(op.Id).padStart(3);
      const nom = (op.Nombre || '').substring(0, 36).padEnd(36);
      const nit = (op.NIT || '').padEnd(12);
      const mail = (op.Correo || '').substring(0, 31).padEnd(31);
      const cel = (op.Celular || '').padEnd(12);
      console.log(`   │${id} │ ${nom} │ ${nit} │ ${mail} │ ${cel} │`);
    });
    console.log('   └────┴──────────────────────────────────────┴──────────────┴─────────────────────────────────┴──────────────┘');
  }

  console.log(`\n━━━ CALIFICACIÓN GLOBAL ━━━`);
  console.log(`\n   ╔══════════════════════════════════════════════════╗`);
  console.log(`   ║  CALIFICACIÓN: 🔴 CRÍTICA — NO CONFORME          ║`);
  console.log(`   ║                                                  ║`);
  console.log(`   ║  OWASP API Top 10:  ${auditoria.resumen.owaspViolados}/8 violados              ║`);
  console.log(`   ║  Ley 1581 de 2012:  ${auditoria.resumen.ley1581Violados}/10 artículos violados     ║`);
  console.log(`   ║  ISO 27001:         ${auditoria.resumen.iso27001NoConforme}/7 controles no conformes   ║`);
  console.log(`   ╚══════════════════════════════════════════════════╝`);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✅ PARTE 5 COMPLETADA');
  console.log('  Archivo: auditoria_datos_confidenciales.json');
  console.log('  Generando informe HTML de seguridad...');
  console.log('═══════════════════════════════════════════════════════\n');
}

main();

#!/usr/bin/env node
/**
 * PARTE 3: Análisis Profundo de Operadores/Proveedores y Usuarios
 * 
 * Lee los datos obtenidos en Partes 1 y 2 para generar:
 *   1. Directorio completo de operadores con NIT y datos de contacto
 *   2. Cruce operadores vs estaciones (quién tiene y quién no)
 *   3. Análisis de tipos de operador y estados
 *   4. Análisis de usuarios y tipos de cuenta
 *   5. Hallazgos de seguridad relevantes
 *   6. Mapa de endpoints API completo
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;

function loadJSON(filename) {
  const filepath = path.join(DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`   ⚠️  No existe: ${filename}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function saveJSON(filename, data) {
  fs.writeFileSync(path.join(DIR, filename), JSON.stringify(data, null, 2), 'utf8');
  console.log(`   💾 Guardado: ${filename}`);
}

function saveCSV(filename, headers, rows) {
  const escapeCsv = (val) => {
    const s = String(val ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  rows.forEach(row => lines.push(row.map(escapeCsv).join(',')));
  fs.writeFileSync(path.join(DIR, filename), '\ufeff' + lines.join('\n'), 'utf8');
  console.log(`   💾 Guardado: ${filename} (${rows.length} filas)`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  PARTE 3: Análisis Profundo de Operadores y Usuarios');
  console.log('  Plataforma CARGAME - MinEnergía Colombia');
  console.log('═══════════════════════════════════════════════════════');

  // ─── Cargar datos ────────────────────────────────────────────
  console.log('\n📂 Cargando datos de partes anteriores...');
  const operadores = loadJSON('descubierto_crg_operador.json');
  const usuarios = loadJSON('descubierto_crg_usuario.json');
  const consentimientos = loadJSON('descubierto_crg_consentimiento.json');
  const estaciones = loadJSON('data_estaciones_completas.json');
  const filtros = loadJSON('catalogo_filtros_agrupados.json');

  if (!operadores) {
    console.error('❌ Falta descubierto_crg_operador.json. Ejecuta parte2 primero.');
    process.exit(1);
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. DIRECTORIO COMPLETO DE OPERADORES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━ 1. DIRECTORIO COMPLETO DE OPERADORES (194) ━━━');

  const tiposOperador = {};
  const estadosOperador = {};
  const tiposPersona = {};
  const departamentosOp = {};

  const directorioOperadores = operadores.map(op => {
    // Contar categorías
    const tipoOp = op.Tipooperador?.TipoOperador || 'Sin tipo';
    tiposOperador[tipoOp] = (tiposOperador[tipoOp] || 0) + 1;

    const estado = op.Estadooperador?.NombreEstado || 'Sin estado';
    estadosOperador[estado] = (estadosOperador[estado] || 0) + 1;

    const tipoPers = op.Tipopersona?.Nombre || 'Sin tipo';
    tiposPersona[tipoPers] = (tiposPersona[tipoPers] || 0) + 1;

    const depto = op.Departamento?.NombreDepartamento || 'Sin depto';
    departamentosOp[depto] = (departamentosOp[depto] || 0) + 1;

    return {
      Id: op.Id,
      Nombre: op.Nombres,
      Siglas: op.Siglas || '',
      TipoIdentificacion: op.Tipoidentificacion?.NombreIdentificacion || '',
      NIT_Identificacion: op.Nroidentificacion || '',
      TipoOperador: tipoOp,
      Estado: estado,
      TipoPersona: tipoPers,
      Departamento: depto,
      Municipio: op.Municipio?.NombreMunicipio || '',
      Correo: op.Correo || '',
      Celular: op.Celular || '',
      Telefono: op.Telefonofijo || '',
      Indicativo: op.Indicativo || '',
      Direccion: op.Direccion || '',
      SitioWeb: op.Sitio || '',
      FechaCreacion: op.Fechacreacion || '',
      TieneArchivos: op.Files ? 'SI' : 'NO'
    };
  });

  saveJSON('analisis_directorio_operadores.json', directorioOperadores);

  // CSV para fácil revisión
  const headersOp = ['Id', 'Nombre', 'Siglas', 'TipoID', 'NIT', 'TipoOperador', 'Estado',
    'TipoPersona', 'Departamento', 'Municipio', 'Correo', 'Celular', 'Telefono',
    'Direccion', 'SitioWeb', 'FechaCreacion'];
  const rowsOp = directorioOperadores.map(op => [
    op.Id, op.Nombre, op.Siglas, op.TipoIdentificacion, op.NIT_Identificacion,
    op.TipoOperador, op.Estado, op.TipoPersona, op.Departamento, op.Municipio,
    op.Correo, op.Celular, op.Telefono, op.Direccion, op.SitioWeb, op.FechaCreacion
  ]);
  saveCSV('analisis_directorio_operadores.csv', headersOp, rowsOp);

  console.log(`\n   📊 Tipos de Operador:`);
  Object.entries(tiposOperador).sort((a, b) => b[1] - a[1]).forEach(([t, c]) =>
    console.log(`      ${String(c).padStart(4)} x ${t}`));

  console.log(`\n   📊 Estados:`);
  Object.entries(estadosOperador).sort((a, b) => b[1] - a[1]).forEach(([t, c]) =>
    console.log(`      ${String(c).padStart(4)} x ${t}`));

  console.log(`\n   📊 Tipos de Persona:`);
  Object.entries(tiposPersona).sort((a, b) => b[1] - a[1]).forEach(([t, c]) =>
    console.log(`      ${String(c).padStart(4)} x ${t}`));

  console.log(`\n   📊 Top 10 Departamentos (operadores):`);
  Object.entries(departamentosOp).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([t, c]) =>
    console.log(`      ${String(c).padStart(4)} x ${t}`));

  // ═══════════════════════════════════════════════════════════════
  // 2. CRUCE: OPERADORES CON vs SIN ESTACIONES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━ 2. CRUCE OPERADORES vs ESTACIONES ━━━');

  const operadoresConEstacion = new Set();
  if (estaciones) {
    estaciones.forEach(est => {
      if (est.Operador?.Id) operadoresConEstacion.add(est.Operador.Id);
    });
  }

  const conEstacion = [];
  const sinEstacion = [];

  directorioOperadores.forEach(op => {
    if (operadoresConEstacion.has(op.Id)) {
      const numEst = estaciones.filter(e => e.Operador?.Id === op.Id).length;
      conEstacion.push({ ...op, NumEstaciones: numEst });
    } else {
      sinEstacion.push({ ...op, NumEstaciones: 0 });
    }
  });

  saveJSON('analisis_operadores_CON_estaciones.json', conEstacion);
  saveJSON('analisis_operadores_SIN_estaciones.json', sinEstacion);

  console.log(`   ✅ Operadores CON estaciones registradas: ${conEstacion.length}`);
  console.log(`   ⚠️  Operadores SIN estaciones registradas: ${sinEstacion.length}`);

  console.log(`\n   📋 Operadores CON estaciones (${conEstacion.length}):`);
  conEstacion.sort((a, b) => b.NumEstaciones - a.NumEstaciones).forEach(op => {
    console.log(`      ${String(op.NumEstaciones).padStart(3)} est. | NIT: ${op.NIT_Identificacion.padEnd(12)} | ${op.Nombre.substring(0, 50)}`);
  });

  console.log(`\n   📋 Operadores SIN estaciones — primeros 20 (de ${sinEstacion.length}):`);
  sinEstacion.slice(0, 20).forEach(op => {
    console.log(`      [${op.Estado.padEnd(7)}] NIT: ${op.NIT_Identificacion.padEnd(12)} | ${op.Nombre.substring(0, 50)} | ${op.Departamento}`);
  });

  // CSV del cruce
  const headersCruce = ['Id', 'Nombre', 'NIT', 'TipoOperador', 'Estado', 'TieneEstaciones', 'NumEstaciones', 'Departamento', 'Municipio', 'Correo', 'FechaRegistro'];
  const rowsCruce = directorioOperadores.map(op => {
    const tieneEst = operadoresConEstacion.has(op.Id);
    const numEst = tieneEst ? estaciones.filter(e => e.Operador?.Id === op.Id).length : 0;
    return [op.Id, op.Nombre, op.NIT_Identificacion, op.TipoOperador, op.Estado,
      tieneEst ? 'SI' : 'NO', numEst, op.Departamento, op.Municipio, op.Correo, op.FechaCreacion];
  });
  saveCSV('analisis_cruce_operadores_estaciones.csv', headersCruce, rowsCruce);

  // ═══════════════════════════════════════════════════════════════
  // 3. ANÁLISIS DE USUARIOS
  // ═══════════════════════════════════════════════════════════════
  if (usuarios) {
    console.log('\n━━━ 3. ANÁLISIS DE USUARIOS ━━━');

    const tiposUsuario = {};
    const estadosUsuario = {};
    const dominiosCorreo = {};

    const directorioUsuarios = usuarios.map(u => {
      const tipoUsr = u.Tipousuario?.NombreTipo || 'Sin tipo';
      tiposUsuario[tipoUsr] = (tiposUsuario[tipoUsr] || 0) + 1;

      const estadoUsr = u.Estadousuario?.NombreEstado || 'Sin estado';
      estadosUsuario[estadoUsr] = (estadosUsuario[estadoUsr] || 0) + 1;

      if (u.Correo) {
        const dominio = u.Correo.split('@')[1] || 'sin-dominio';
        dominiosCorreo[dominio] = (dominiosCorreo[dominio] || 0) + 1;
      }

      return {
        Id: u.Id,
        Nombres: u.Nombres || '',
        Apellidos: u.Apellidos || '',
        TipoIdentificacion: u.Tipoidentificacion?.NombreIdentificacion || '',
        Identificacion: u.Nroidentificacion || '',
        Usuario: u.Usuario || '',
        TipoUsuario: tipoUsr,
        DescTipoUsuario: u.Tipousuario?.DescTipo || '',
        Estado: estadoUsr,
        Correo: u.Correo || '',
        Celular: u.Celular || '',
        FechaCreacion: u.Fechacreacion || '',
        FechaExpira: u.Fechaexpira || '',
        CoordinacionOperativa: u.Coordinacionoperativa?.Coordinacionoperativa || '',
        // NOTA: El campo Clave (hash bcrypt) está expuesto — hallazgo de seguridad
        ClaveExpuesta: u.Clave ? 'SI (bcrypt hash)' : 'NO'
      };
    });

    saveJSON('analisis_directorio_usuarios.json', directorioUsuarios);

    const headersUsr = ['Id', 'Nombres', 'Apellidos', 'TipoID', 'Identificacion', 'Usuario',
      'TipoUsuario', 'Estado', 'Correo', 'FechaCreacion', 'FechaExpira', 'Coordinacion'];
    const rowsUsr = directorioUsuarios.map(u => [
      u.Id, u.Nombres, u.Apellidos, u.TipoIdentificacion, u.Identificacion, u.Usuario,
      u.TipoUsuario, u.Estado, u.Correo, u.FechaCreacion, u.FechaExpira, u.CoordinacionOperativa
    ]);
    saveCSV('analisis_directorio_usuarios.csv', headersUsr, rowsUsr);

    console.log(`   Total usuarios: ${usuarios.length}`);

    console.log(`\n   📊 Tipos de Usuario:`);
    Object.entries(tiposUsuario).sort((a, b) => b[1] - a[1]).forEach(([t, c]) =>
      console.log(`      ${String(c).padStart(4)} x ${t}`));

    console.log(`\n   📊 Estados de Usuario:`);
    Object.entries(estadosUsuario).sort((a, b) => b[1] - a[1]).forEach(([t, c]) =>
      console.log(`      ${String(c).padStart(4)} x ${t}`));

    console.log(`\n   📊 Top Dominios de Correo:`);
    Object.entries(dominiosCorreo).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([d, c]) =>
      console.log(`      ${String(c).padStart(4)} x @${d}`));
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. HALLAZGOS DE SEGURIDAD
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━ 4. HALLAZGOS DE SEGURIDAD ━━━');

  const hallazgos = [];

  // JWT estático hardcodeado
  hallazgos.push({
    severidad: 'CRÍTICA',
    hallazgo: 'Token JWT estático hardcodeado en el frontend',
    detalle: 'El token JWT usado para autenticación está embebido en el bundle JS del frontend. Nunca expira (iat: 2020-07-16). Rol: "intelligence", usuario: "powerbi".',
    impacto: 'Cualquier persona puede consumir las APIs sin autenticarse. El token es público.',
    endpoint: 'Todos los endpoints /crg/*'
  });

  // Hashes de contraseñas expuestos
  if (usuarios) {
    const usersConClave = usuarios.filter(u => u.Clave);
    if (usersConClave.length > 0) {
      hallazgos.push({
        severidad: 'CRÍTICA',
        hallazgo: 'Hashes bcrypt de contraseñas expuestos vía API',
        detalle: `El endpoint /crg/usuario devuelve ${usersConClave.length} usuarios con sus hashes bcrypt de contraseña.`,
        impacto: 'Aunque bcrypt es resistente, exponer hashes es una vulnerabilidad grave. Permite ataques de fuerza bruta offline.',
        endpoint: 'GET /crg/usuario'
      });
    }
  }

  // Datos personales expuestos
  hallazgos.push({
    severidad: 'ALTA',
    hallazgo: 'Datos personales de usuarios expuestos sin autenticación real',
    detalle: 'Nombres, cédulas, correos, celulares y direcciones de 272 usuarios y 194 operadores son accesibles.',
    impacto: 'Posible violación de Ley de Protección de Datos Personales (Ley 1581 de 2012 - Colombia).',
    endpoint: 'GET /crg/usuario, GET /crg/operador'
  });

  // Sin CORS restrictivo
  hallazgos.push({
    severidad: 'MEDIA',
    hallazgo: 'APIs accesibles desde cualquier origen (CORS permisivo)',
    detalle: 'Las APIs responden a peticiones cross-origin sin restricciones verificadas.',
    impacto: 'Cualquier sitio web podría hacer peticiones a las APIs de CARGAME.',
    endpoint: 'Todos los endpoints'
  });

  // Sin rate limiting aparente
  hallazgos.push({
    severidad: 'MEDIA',
    hallazgo: 'Sin rate limiting aparente',
    detalle: 'No se detectaron headers de rate limiting (X-RateLimit-*) en las respuestas.',
    impacto: 'Las APIs podrían ser abusadas con solicitudes masivas.',
    endpoint: 'Todos los endpoints'
  });

  saveJSON('analisis_hallazgos_seguridad.json', hallazgos);

  console.log(`   🔴 Hallazgos encontrados: ${hallazgos.length}\n`);
  hallazgos.forEach((h, i) => {
    const icon = h.severidad === 'CRÍTICA' ? '🔴' : h.severidad === 'ALTA' ? '🟠' : '🟡';
    console.log(`   ${icon} [${h.severidad}] ${h.hallazgo}`);
    console.log(`      ${h.detalle.substring(0, 100)}`);
    console.log(`      Endpoint: ${h.endpoint}\n`);
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. MAPA COMPLETO DE APIs
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━ 5. MAPA COMPLETO DE APIs DESCUBIERTAS ━━━');

  const mapaAPIs = {
    servidor: {
      host: 'siveeic.minenergia.gov.co',
      puerto: 3011,
      protocolo: 'HTTPS',
      basePath: '/crg/',
      autenticacion: 'JWT Bearer Token (estático, hardcodeado en frontend)',
      tecnologia_backend: 'Node.js/Express (inferido por formato de errores y headers)'
    },
    servicios_frontend: {
      USUARIOS_SERVICE: 'https://siveeic.minenergia.gov.co:3011/crg/',
      REGISTROS_SERVICE: 'https://siveeic.minenergia.gov.co:3011/crg/',
      CONSENTIMIENTO_SERVICE: 'https://siveeic.minenergia.gov.co:3011/crg/',
      FILES_SERVICE: 'https://siveeic.minenergia.gov.co:3011/',
      SITE_SIVEEIC: 'https://siveeic.minenergia.gov.co'
    },
    endpoints_confirmados: [
      {
        metodo: 'GET',
        path: '/crg/resumenestacionescarga/{tipoOperador}/{estado}',
        descripcion: 'Listado completo de estaciones de carga con todos los detalles',
        parametros: 'tipoOperador: 0=todos, estado: 0=activos, 1=inactivos(?)',
        registros: estaciones?.length || 'N/A',
        autenticacion: 'JWT',
        datos_clave: 'Id, Operador(Id,Nombre,Sitio), Nombre, Direccion, Departamento, Municipio, Ubicacion, Tipoestacion, Horario, Lat/Lng, Estado, Conectores, PotenciaMax, Cobros, Precios, Files'
      },
      {
        metodo: 'GET',
        path: '/crg/operador',
        descripcion: 'Directorio completo de operadores/proveedores registrados',
        registros: operadores?.length || 'N/A',
        autenticacion: 'JWT',
        datos_clave: 'Id, Nombres, NIT, TipoOperador(Convencional/NoConvencional), Estado, Departamento, Municipio, Contacto(correo,celular,telefono), Direccion, Sitio, FechaCreacion, Siglas'
      },
      {
        metodo: 'GET',
        path: '/crg/usuario',
        descripcion: '⚠️ Lista completa de usuarios con hashes de contraseña',
        registros: usuarios?.length || 'N/A',
        autenticacion: 'JWT',
        datos_clave: 'Id, Nombres, Apellidos, CC/NIT, Usuario, Clave(bcrypt!), TipoUsuario, Estado, Correo, Celular, FechaExpira, CoordinacionOperativa'
      },
      {
        metodo: 'GET',
        path: '/crg/tipoubicacion',
        descripcion: 'Catálogo de tipos de ubicación de estaciones',
        registros: 11,
        autenticacion: 'JWT',
        datos_clave: 'Id, Nombre'
      },
      {
        metodo: 'GET',
        path: '/crg/municipiofull',
        descripcion: 'Catálogo completo de municipios de Colombia con coordenadas',
        registros: 1122,
        autenticacion: 'JWT',
        datos_clave: 'Id, Nombremunicipio, Iddepartamento, Nombredepartamento, Longitud, Latitud, Zomac, Pedet'
      },
      {
        metodo: 'GET',
        path: '/crg/municipio',
        descripcion: 'Catálogo simplificado de municipios',
        registros: 1122,
        autenticacion: 'JWT',
        datos_clave: 'Id, Nombre, Iddepartamento'
      },
      {
        metodo: 'GET',
        path: '/crg/departamento',
        descripcion: 'Catálogo de departamentos',
        registros: 33,
        autenticacion: 'JWT',
        datos_clave: 'Id, Nombre'
      },
      {
        metodo: 'GET',
        path: '/crg/filtrosbuscar',
        descripcion: 'Filtros disponibles para búsqueda de estaciones',
        registros: 223,
        autenticacion: 'JWT',
        datos_clave: 'Filtro(Acceso|Conectores|Estacion|Operador|Ubicacion), Nombre'
      },
      {
        metodo: 'GET',
        path: '/crg/consentimiento',
        descripcion: 'Registros de consentimiento de tratamiento de datos',
        registros: consentimientos?.length || 'N/A',
        autenticacion: 'JWT',
        datos_clave: 'id_tratamiento, Operador, Usuario, Autorizo, Estado, Fecha'
      },
      {
        metodo: 'GET',
        path: '/crg/canalmanual/{id}/canalManualesCarga',
        descripcion: 'Documentos y manuales de la plataforma',
        registros: 1,
        autenticacion: 'JWT',
        datos_clave: 'Id, Nombre(URL al PDF)'
      },
      {
        metodo: 'GET',
        path: '/estacion/filefoto/{id}.{ext}',
        descripcion: 'Fotos de estaciones de carga (archivos estáticos)',
        autenticacion: 'Posiblemente sin auth',
        datos_clave: 'Imagen de la estación'
      },
      {
        metodo: 'GET',
        path: '/estacion/filecumplimiento/{id}.pdf',
        descripcion: 'Declaraciones de cumplimiento (PDF)',
        autenticacion: 'Posiblemente sin auth',
        datos_clave: 'PDF del documento legal'
      },
      {
        metodo: 'GET',
        path: '/estacion/fileconformidad/{id}.pdf',
        descripcion: 'Certificados de conformidad (PDF)',
        autenticacion: 'Posiblemente sin auth',
        datos_clave: 'PDF del certificado'
      },
      {
        metodo: 'GET',
        path: '/estacion/filelegal/{nombre}.pdf',
        descripcion: 'Documentos legales (manuales)',
        autenticacion: 'Posiblemente sin auth',
        datos_clave: 'PDF del manual'
      }
    ],
    endpoints_inferidos_no_confirmados: [
      'POST /crg/login - Autenticación de usuarios (inferido del i18n)',
      'POST /crg/registro - Registro de nuevos operadores (inferido del i18n)',
      'POST /crg/estacion - Crear estación (inferido de flujo CRUD)',
      'PUT /crg/estacion/{id} - Actualizar estación',
      'DELETE /crg/estacion/{id} - Eliminar estación',
      'POST /crg/operador - Crear operador',
      'PUT /crg/operador/{id} - Actualizar operador',
      'POST /crg/upload - Subir archivos (inferido de FILES_SERVICE)',
      'GET /crg/resumenestacionescarga/{operadorId}/0 - Filtrar por operador (param1=operadorId, error 500 actual)'
    ]
  };

  saveJSON('analisis_mapa_apis_completo.json', mapaAPIs);

  console.log('\n   APIs confirmadas y funcionales:');
  mapaAPIs.endpoints_confirmados.forEach((ep, i) => {
    console.log(`   ${String(i + 1).padStart(2)}. ${ep.metodo} ${ep.path}`);
    console.log(`       → ${ep.descripcion} (${ep.registros} registros)`);
  });

  // ═══════════════════════════════════════════════════════════════
  // RESUMEN FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  RESUMEN PARTE 3');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\n  📊 Datos analizados:`);
  console.log(`     - ${operadores.length} operadores/proveedores registrados`);
  console.log(`     - ${conEstacion.length} operadores CON estaciones`);
  console.log(`     - ${sinEstacion.length} operadores SIN estaciones`);
  if (usuarios) console.log(`     - ${usuarios.length} usuarios en la plataforma`);
  if (estaciones) console.log(`     - ${estaciones.length} estaciones de carga activas`);
  console.log(`     - ${mapaAPIs.endpoints_confirmados.length} endpoints API confirmados`);
  console.log(`     - ${hallazgos.length} hallazgos de seguridad`);

  console.log('\n  📁 Archivos generados:');
  console.log('     - analisis_directorio_operadores.json/csv');
  console.log('     - analisis_operadores_CON_estaciones.json');
  console.log('     - analisis_operadores_SIN_estaciones.json');
  console.log('     - analisis_cruce_operadores_estaciones.csv');
  console.log('     - analisis_directorio_usuarios.json/csv');
  console.log('     - analisis_hallazgos_seguridad.json');
  console.log('     - analisis_mapa_apis_completo.json');

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✅ PARTE 3 COMPLETADA');
  console.log('  Continuar con parte4 para informe ejecutivo final');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});

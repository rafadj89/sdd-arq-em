#!/usr/bin/env node
/**
 * PARTE 1: Consulta de Estaciones de Carga y Extracción de Operadores
 * 
 * Llama a la API principal de CARGAME para obtener todas las estaciones
 * y extrae un listado único de operadores/proveedores registrados.
 * 
 * Endpoints consultados:
 *   GET https://siveeic.minenergia.gov.co:3011/crg/resumenestacionescarga/0/0
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = __dirname;

const API_CONFIG = {
  baseUrl: 'https://siveeic.minenergia.gov.co:3011',
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MCwidXN1YXJpbyI6InBvd2VyYmkiLCJyb2xlIjoiaW50ZWxsaWdlbmNlIiwiaWF0IjoxNTk0ODQ5NjMxfQ.UY3BLtqi5zdxpRFaT9XIsYvQIV4gPPXN6iO39AlymMY',
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Origin': 'https://cargame.minenergia.gov.co',
    'Referer': 'https://cargame.minenergia.gov.co/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
};

function fetchAPI(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    console.log(`\n🔗 Llamando: ${url}`);

    const options = {
      headers: {
        ...API_CONFIG.headers,
        'authorization': API_CONFIG.token
      },
      rejectUnauthorized: false // Certificados del gobierno pueden no ser estándar
    };

    https.get(url, options, (res) => {
      let data = '';
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Content-Type: ${res.headers['content-type']}`);

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          console.log(`   ⚠️  Respuesta no es JSON válido (${data.length} bytes)`);
          resolve(data);
        }
      });
    }).on('error', (e) => {
      console.error(`   ❌ Error: ${e.message}`);
      reject(e);
    });
  });
}

function saveJSON(filename, data) {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`   💾 Guardado: ${filename}`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  PARTE 1: Estaciones de Carga y Operadores');
  console.log('  Plataforma CARGAME - MinEnergía Colombia');
  console.log('═══════════════════════════════════════════════════════');

  // ─── 1. Obtener todas las estaciones ─────────────────────────
  console.log('\n📡 PASO 1: Obteniendo estaciones de carga...');
  const estaciones = await fetchAPI('/crg/resumenestacionescarga/0/0');

  if (!Array.isArray(estaciones)) {
    console.error('❌ La respuesta no es un array. Abortando.');
    console.log('Respuesta:', typeof estaciones === 'string' ? estaciones.substring(0, 500) : JSON.stringify(estaciones).substring(0, 500));
    return;
  }

  console.log(`\n   ✅ Total estaciones obtenidas: ${estaciones.length}`);
  saveJSON('data_estaciones_completas.json', estaciones);

  // ─── 2. Extraer operadores únicos ────────────────────────────
  console.log('\n📊 PASO 2: Extrayendo operadores/proveedores únicos...');
  const operadoresMap = new Map();

  estaciones.forEach(est => {
    if (est.Operador) {
      const op = est.Operador;
      if (!operadoresMap.has(op.Id)) {
        operadoresMap.set(op.Id, {
          Id: op.Id,
          Nombre: op.Nombreempresa,
          Sitio: op.Sitio || '',
          TotalEstaciones: 0,
          Estaciones: [],
          Departamentos: new Set(),
          Municipios: new Set(),
          Conectores: new Set(),
          PotenciaMaxTotal: 0
        });
      }
      const registro = operadoresMap.get(op.Id);
      registro.TotalEstaciones++;
      registro.Estaciones.push({
        Nombre: est.Nombre,
        Direccion: est.Direccion,
        Departamento: est.Departamento?.NombreDepartamento,
        Municipio: est.Municipio?.NombreMunicipio,
        Estado: est.Estado?.NombreEstado,
        PuntosCarga: est.Puntoscarga,
        PotenciaMax: est.PotenciaMax,
        Conectores: est.Conectores,
        Latitud: est.Latitud,
        Longitud: est.Longitud,
        FechaCreacion: est.Fechacreacion
      });
      if (est.Departamento?.NombreDepartamento) {
        registro.Departamentos.add(est.Departamento.NombreDepartamento);
      }
      if (est.Municipio?.NombreMunicipio) {
        registro.Municipios.add(est.Municipio.NombreMunicipio);
      }
      if (est.Conectores) {
        Object.keys(est.Conectores).forEach(c => registro.Conectores.add(c));
      }
      registro.PotenciaMaxTotal = Math.max(registro.PotenciaMaxTotal, est.PotenciaMax || 0);
    }
  });

  // Convertir Sets a Arrays para serializar
  const operadores = Array.from(operadoresMap.values())
    .map(op => ({
      ...op,
      Departamentos: Array.from(op.Departamentos),
      Municipios: Array.from(op.Municipios),
      Conectores: Array.from(op.Conectores)
    }))
    .sort((a, b) => b.TotalEstaciones - a.TotalEstaciones);

  saveJSON('data_operadores_proveedores.json', operadores);

  // ─── 3. Resumen en consola ───────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  RESUMEN DE OPERADORES/PROVEEDORES REGISTRADOS');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\n  Total operadores únicos: ${operadores.length}`);
  console.log(`  Total estaciones activas: ${estaciones.length}\n`);

  console.log('  #   | Est. | Operador/Proveedor                              | Departamentos');
  console.log('  ────┼──────┼─────────────────────────────────────────────────┼──────────────────');

  operadores.forEach((op, i) => {
    const num = String(i + 1).padStart(3);
    const est = String(op.TotalEstaciones).padStart(4);
    const nombre = op.Nombre.substring(0, 47).padEnd(47);
    const deptos = op.Departamentos.slice(0, 3).join(', ');
    console.log(`  ${num} | ${est} | ${nombre} | ${deptos}`);
  });

  // ─── 4. Estadísticas generales ──────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ESTADÍSTICAS GENERALES');
  console.log('═══════════════════════════════════════════════════════');

  const todosConectores = {};
  const todosDepartamentos = {};
  const todosEstados = {};
  let totalPuntosCarga = 0;

  estaciones.forEach(est => {
    // Conectores
    if (est.Conectores) {
      Object.entries(est.Conectores).forEach(([tipo, cant]) => {
        todosConectores[tipo] = (todosConectores[tipo] || 0) + cant;
      });
    }
    // Departamentos
    const depto = est.Departamento?.NombreDepartamento || 'Sin info';
    todosDepartamentos[depto] = (todosDepartamentos[depto] || 0) + 1;
    // Estados
    const estado = est.Estado?.NombreEstado || 'Sin info';
    todosEstados[estado] = (todosEstados[estado] || 0) + 1;
    // Puntos de carga
    totalPuntosCarga += est.Puntoscarga || 0;
  });

  console.log(`\n  📌 Total puntos de carga: ${totalPuntosCarga}`);

  console.log('\n  🔌 Conectores:');
  Object.entries(todosConectores).sort((a, b) => b[1] - a[1]).forEach(([tipo, cant]) => {
    console.log(`     ${String(cant).padStart(4)} x ${tipo}`);
  });

  console.log('\n  🗺️  Top 10 Departamentos:');
  Object.entries(todosDepartamentos).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([depto, cant]) => {
    console.log(`     ${String(cant).padStart(4)} estaciones en ${depto}`);
  });

  console.log('\n  📋 Estados:');
  Object.entries(todosEstados).forEach(([estado, cant]) => {
    console.log(`     ${String(cant).padStart(4)} x ${estado}`);
  });

  const resumen = {
    fecha: new Date().toISOString(),
    totalEstaciones: estaciones.length,
    totalOperadores: operadores.length,
    totalPuntosCarga,
    conectores: todosConectores,
    departamentos: todosDepartamentos,
    estados: todosEstados,
    top10Operadores: operadores.slice(0, 10).map(op => ({
      Nombre: op.Nombre,
      TotalEstaciones: op.TotalEstaciones,
      Departamentos: op.Departamentos
    }))
  };
  saveJSON('data_resumen_estadisticas.json', resumen);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✅ PARTE 1 COMPLETADA');
  console.log('  Archivos generados:');
  console.log('    - data_estaciones_completas.json');
  console.log('    - data_operadores_proveedores.json');
  console.log('    - data_resumen_estadisticas.json');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});

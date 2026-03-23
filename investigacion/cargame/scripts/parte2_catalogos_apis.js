#!/usr/bin/env node
/**
 * PARTE 2: Consulta de APIs de Catálogos
 * 
 * Llama a las APIs de catálogos de CARGAME:
 *   - tipoubicacion: Tipos de ubicación de estaciones
 *   - municipiofull: Catálogo completo de municipios de Colombia
 *   - filtrosbuscar: Filtros de búsqueda disponibles
 *   - canalmanual: Documentos/manuales de la plataforma
 * 
 * También prueba endpoints adicionales descubiertos en el bundle JS.
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

function fetchAPI(endpoint, label) {
  return new Promise((resolve) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.baseUrl}${endpoint}`;
    console.log(`\n🔗 [${label}] ${url}`);

    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        ...API_CONFIG.headers,
        'authorization': API_CONFIG.token
      },
      rejectUnauthorized: false,
      timeout: 15000
    };

    const req = https.get(url, { headers: options.headers, rejectUnauthorized: false, timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode} | Size: ${data.length} bytes`);
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, raw: null, error: null });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data.substring(0, 500), error: 'No es JSON' });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ Error: ${e.message}`);
      resolve({ status: 0, data: null, raw: null, error: e.message });
    });

    req.on('timeout', () => {
      console.log(`   ⏱️ Timeout`);
      req.destroy();
      resolve({ status: 0, data: null, raw: null, error: 'Timeout' });
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
  console.log('  PARTE 2: APIs de Catálogos de CARGAME');
  console.log('═══════════════════════════════════════════════════════');

  const resultados = {};

  // ─── API: Tipos de Ubicación ─────────────────────────────────
  console.log('\n━━━ 1/4: TIPOS DE UBICACIÓN ━━━');
  const tiposUbic = await fetchAPI('/crg/tipoubicacion', 'tipoubicacion');
  if (tiposUbic.data) {
    resultados.tipoubicacion = tiposUbic.data;
    saveJSON('catalogo_tipos_ubicacion.json', tiposUbic.data);
    console.log(`   ✅ ${tiposUbic.data.length} tipos de ubicación:`);
    tiposUbic.data.forEach(t => console.log(`      - [${t.Id}] ${t.Nombre}`));
  }

  // ─── API: Municipios Completo ────────────────────────────────
  console.log('\n━━━ 2/4: MUNICIPIOS DE COLOMBIA ━━━');
  const municipios = await fetchAPI('/crg/municipiofull', 'municipiofull');
  if (municipios.data) {
    resultados.municipiofull = municipios.data;
    saveJSON('catalogo_municipios_full.json', municipios.data);
    
    // Extraer departamentos únicos
    const departamentos = {};
    municipios.data.forEach(m => {
      if (!departamentos[m.Iddepartamento]) {
        departamentos[m.Iddepartamento] = {
          Id: m.Iddepartamento,
          Nombre: m.Nombredepartamento,
          TotalMunicipios: 0,
          TieneZomac: false,
          TienePedet: false
        };
      }
      departamentos[m.Iddepartamento].TotalMunicipios++;
      if (m.Zomac === 'SI') departamentos[m.Iddepartamento].TieneZomac = true;
      if (m.Pedet === 'SI') departamentos[m.Iddepartamento].TienePedet = true;
    });

    const deptosList = Object.values(departamentos).sort((a, b) => a.Id - b.Id);
    saveJSON('catalogo_departamentos.json', deptosList);

    console.log(`   ✅ ${municipios.data.length} municipios en ${deptosList.length} departamentos`);
    console.log(`   📊 Campos por municipio: Id, Nombremunicipio, Iddepartamento, Nombredepartamento, Longitud, Latitud, Zomac, Pedet`);
  }

  // ─── API: Filtros de Búsqueda ────────────────────────────────
  console.log('\n━━━ 3/4: FILTROS DE BÚSQUEDA ━━━');
  const filtros = await fetchAPI('/crg/filtrosbuscar', 'filtrosbuscar');
  if (filtros.data) {
    resultados.filtrosbuscar = filtros.data;
    saveJSON('catalogo_filtros_busqueda.json', filtros.data);

    // Agrupar por tipo de filtro
    const gruposFiltro = {};
    filtros.data.forEach(f => {
      if (!gruposFiltro[f.Filtro]) gruposFiltro[f.Filtro] = [];
      gruposFiltro[f.Filtro].push(f.Nombre);
    });

    console.log(`   ✅ ${filtros.data.length} filtros en ${Object.keys(gruposFiltro).length} categorías:`);
    Object.entries(gruposFiltro).forEach(([cat, items]) => {
      console.log(`\n   📂 ${cat} (${items.length} opciones):`);
      items.slice(0, 5).forEach(i => console.log(`      - ${i}`));
      if (items.length > 5) console.log(`      ... y ${items.length - 5} más`);
    });

    saveJSON('catalogo_filtros_agrupados.json', gruposFiltro);
  }

  // ─── API: Manuales/Documentos ────────────────────────────────
  console.log('\n━━━ 4/4: MANUALES Y DOCUMENTOS ━━━');
  const manuales = await fetchAPI('/crg/canalmanual/0/canalManualesCarga', 'canalmanual');
  if (manuales.data) {
    resultados.canalmanual = manuales.data;
    saveJSON('catalogo_manuales.json', manuales.data);
    console.log(`   ✅ ${manuales.data.length} documento(s):`);
    if (Array.isArray(manuales.data)) {
      manuales.data.forEach(d => console.log(`      - [${d.Id}] ${d.Nombre}`));
    }
  }

  // ─── BONUS: Probar endpoints adicionales del bundle JS ───────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  BONUS: Probando endpoints adicionales (descubiertos en JS)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const endpointsAdicionales = [
    // Variaciones del endpoint principal
    { path: '/crg/resumenestacionescarga/1/0', label: 'estaciones param1=1' },
    { path: '/crg/resumenestacionescarga/0/1', label: 'estaciones param2=1' },
    { path: '/crg/resumenestacionescarga/1/1', label: 'estaciones param1=1,param2=1' },
    // Endpoints basados en las entidades del i18n
    { path: '/crg/operador', label: 'operadores' },
    { path: '/crg/operadores', label: 'operadores (plural)' },
    { path: '/crg/estacion', label: 'estacion' },
    { path: '/crg/estaciones', label: 'estaciones' },
    { path: '/crg/conector', label: 'conector' },
    { path: '/crg/conectores', label: 'conectores' },
    { path: '/crg/tipoconector', label: 'tipo conector' },
    { path: '/crg/cargador', label: 'cargador' },
    { path: '/crg/cargadores', label: 'cargadores' },
    { path: '/crg/usuario', label: 'usuario' },
    { path: '/crg/usuarios', label: 'usuarios' },
    { path: '/crg/departamento', label: 'departamento' },
    { path: '/crg/departamentos', label: 'departamentos' },
    { path: '/crg/municipio', label: 'municipio' },
    { path: '/crg/persona', label: 'persona' },
    { path: '/crg/entidad', label: 'entidad' },
    { path: '/crg/registro', label: 'registro' },
    { path: '/crg/registros', label: 'registros' },
    { path: '/crg/consentimiento', label: 'consentimiento' },
    { path: '/crg/estadistica', label: 'estadistica' },
    { path: '/crg/estadisticas', label: 'estadisticas' },
    { path: '/crg/reporte', label: 'reporte' },
    { path: '/crg/reportes', label: 'reportes' },
    // Endpoints de archivos
    { path: '/estacion/filefoto/', label: 'archivos foto' },
    { path: '/estacion/filecumplimiento/', label: 'archivos cumplimiento' },
    { path: '/estacion/fileconformidad/', label: 'archivos conformidad' },
    // Auth
    { path: '/crg/login', label: 'login' },
    { path: '/crg/auth', label: 'auth' },
    // Raíz
    { path: '/crg/', label: 'raíz crg' },
    { path: '/', label: 'raíz servidor' },
  ];

  const descubiertos = [];

  for (const ep of endpointsAdicionales) {
    const result = await fetchAPI(ep.path, ep.label);
    const entry = {
      endpoint: ep.path,
      label: ep.label,
      status: result.status,
      hasData: !!result.data,
      dataType: result.data ? (Array.isArray(result.data) ? `array[${result.data.length}]` : typeof result.data) : null,
      error: result.error,
      preview: result.raw || (result.data ? JSON.stringify(result.data).substring(0, 200) : null)
    };

    if (result.status === 200 && result.data) {
      entry.interesting = true;
      descubiertos.push(entry);
      const safeName = ep.path.replace(/\//g, '_').replace(/^_/, '');
      saveJSON(`descubierto_${safeName}.json`, result.data);
    }
  }

  // ─── Resumen final ──────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  RESUMEN PARTE 2');
  console.log('═══════════════════════════════════════════════════════');

  console.log('\n  APIs de catálogo exitosas:');
  if (resultados.tipoubicacion) console.log(`    ✅ tipoubicacion: ${resultados.tipoubicacion.length} registros`);
  if (resultados.municipiofull) console.log(`    ✅ municipiofull: ${resultados.municipiofull.length} registros`);
  if (resultados.filtrosbuscar) console.log(`    ✅ filtrosbuscar: ${resultados.filtrosbuscar.length} registros`);
  if (resultados.canalmanual) console.log(`    ✅ canalmanual: ${Array.isArray(resultados.canalmanual) ? resultados.canalmanual.length : 1} registros`);

  if (descubiertos.length > 0) {
    console.log(`\n  🔍 Endpoints adicionales descubiertos (${descubiertos.length}):`);
    descubiertos.forEach(d => {
      console.log(`    ✅ ${d.endpoint} → ${d.dataType}`);
    });
  }

  saveJSON('parte2_resumen_endpoints.json', {
    fecha: new Date().toISOString(),
    catalogos: {
      tipoubicacion: { ok: !!resultados.tipoubicacion, registros: resultados.tipoubicacion?.length || 0 },
      municipiofull: { ok: !!resultados.municipiofull, registros: resultados.municipiofull?.length || 0 },
      filtrosbuscar: { ok: !!resultados.filtrosbuscar, registros: resultados.filtrosbuscar?.length || 0 },
      canalmanual: { ok: !!resultados.canalmanual, registros: Array.isArray(resultados.canalmanual) ? resultados.canalmanual.length : 0 },
    },
    endpointsAdicionales: endpointsAdicionales.map(ep => {
      const found = descubiertos.find(d => d.endpoint === ep.path);
      return { endpoint: ep.path, label: ep.label, activo: !!found };
    })
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✅ PARTE 2 COMPLETADA');
  console.log('  Continuar con parte3 para análisis profundo');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});

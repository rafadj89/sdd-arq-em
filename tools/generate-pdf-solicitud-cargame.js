/**
 * Generador de PDF — Solicitud de APIs CargaME
 * Documento formal UPME → Ministerio de Minas y Energía
 *
 * Uso: node tools/generate-pdf-solicitud-cargame.js
 */

const puppeteer = require('puppeteer');
const http      = require('http');
const fs        = require('fs');
const path      = require('path');

const ROOT_DIR   = path.resolve(__dirname, '..');
const INPUT_FILE = path.join('investigacion', 'cargame', 'swagger', 'solicitud-apis-cargame-v1.html');
const OUTPUT_FILE = path.join('investigacion', 'cargame', 'swagger', 'solicitud-apis-cargame-v1.pdf');
const PORT = 9877;

// ── Servidor estático local ───────────────────────────────────────────────────
function startServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
  };

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = decodeURIComponent(req.url.split('?')[0]);
      if (filePath === '/') filePath = '/' + INPUT_FILE;
      const fullPath = path.join(ROOT_DIR, filePath);

      if (!fs.existsSync(fullPath)) {
        res.writeHead(404); res.end('Not found'); return;
      }
      const mime = mimeTypes[path.extname(fullPath).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(fullPath).pipe(res);
    });

    server.listen(PORT, () => {
      console.log(`Servidor local: http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// ── Generación del PDF ────────────────────────────────────────────────────────
async function generatePDF() {
  console.log('Iniciando generación de PDF...');
  console.log(`Origen : ${INPUT_FILE}`);
  console.log(`Destino: ${OUTPUT_FILE}\n`);

  const server  = await startServer();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Viewport A4 equivalente a 96 dpi
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

  const url = `http://localhost:${PORT}/${INPUT_FILE}`;
  console.log(`Cargando: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

  // Esperar fuentes Google Fonts + Tailwind
  console.log('Esperando fuentes y estilos...');
  await new Promise((r) => setTimeout(r, 3000));

  // Estilos de impresión para documento formal A4 vertical
  await page.addStyleTag({
    content: `
      @page {
        size: A4 portrait;
        margin: 20mm 18mm 20mm 18mm;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body {
        font-size: 10pt !important;
        background: #fff !important;
      }

      .doc {
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      /* Portada: página propia */
      .cover {
        page-break-after: always !important;
        page-break-inside: avoid !important;
        border-radius: 0 !important;
      }

      /* Tabla de contenido: no romper */
      .toc {
        page-break-inside: avoid !important;
        column-count: 1 !important;
      }

      /* Encabezados: nunca quedar solos al final de página */
      h1, h2, h3, h4 {
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
      }

      /* Tablas: evitar corte dentro de una fila */
      table {
        page-break-inside: auto !important;
        width: 100% !important;
        font-size: 8.5pt !important;
      }
      tr {
        page-break-inside: avoid !important;
      }
      th, td {
        padding: 5px 8px !important;
      }

      /* Cards y bloques de alerta: evitar corte */
      .card, .card-blue, .card-orange,
      .info, .warn, .danger, .success {
        page-break-inside: avoid !important;
      }

      /* Bloques de código: evitar corte */
      pre {
        page-break-inside: avoid !important;
        white-space: pre-wrap !important;
        word-break: break-all !important;
        font-size: 7.5pt !important;
      }

      /* Divider */
      .divider {
        margin: 12px 0 !important;
      }

      /* Ajuste de tamaños tipográficos para A4 */
      h2 { font-size: 12pt !important; margin-top: 18pt !important; }
      h3 { font-size: 10.5pt !important; }
      h4 { font-size: 10pt !important; }
      p, li { font-size: 9.5pt !important; line-height: 1.5 !important; }
      code { font-size: 8pt !important; }

      /* Ocultar elementos no necesarios en impresión */
      .np { display: none !important; }
    `,
  });

  console.log('Generando PDF...');
  const outputPath = path.join(ROOT_DIR, OUTPUT_FILE);

  await page.pdf({
    path: outputPath,
    format: 'A4',
    landscape: false,
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top:    '20mm',
      right:  '18mm',
      bottom: '20mm',
      left:   '18mm',
    },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:7pt;color:#94a3b8;width:100%;text-align:right;padding-right:18mm;font-family:sans-serif;">
      UPME — Solicitud de APIs CargaME — Uso Interno Restringido
    </div>`,
    footerTemplate: `<div style="font-size:7pt;color:#94a3b8;width:100%;display:flex;justify-content:space-between;padding:0 18mm;font-family:sans-serif;">
      <span>Ministerio de Minas y Energía — Sistema CargaME</span>
      <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
    </div>`,
  });

  console.log(`\nPDF generado exitosamente:`);
  console.log(`  ${outputPath}`);

  await browser.close();
  server.close();
  console.log('Listo.');
}

generatePDF().catch((err) => {
  console.error('Error al generar el PDF:', err);
  process.exit(1);
});

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVE_DIR = path.resolve(__dirname, '../investigacion/cargame/swagger');
const PORT = 9877;
const INPUT_FILE = 'solicitud-apis-cargame-v1.html';
const OUTPUT_FILE = 'solicitud-apis-cargame-v1-vertical.pdf';

// Simple static file server
function startServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = decodeURIComponent(req.url.split('?')[0]);
      if (filePath === '/') filePath = '/' + INPUT_FILE;
      const fullPath = path.join(SERVE_DIR, filePath);

      if (!fs.existsSync(fullPath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(fullPath).toLowerCase();
      const mime = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(fullPath).pipe(res);
    });

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function generatePDF() {
  const server = await startServer();

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  console.log(`Loading ${INPUT_FILE}...`);
  await page.goto(`http://localhost:${PORT}/`, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });

  // Wait for fonts and rendering
  await new Promise((r) => setTimeout(r, 3000));

  // Inject print-optimized styles
  console.log('Injecting print styles...');
  await page.addStyleTag({
    content: `
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .doc {
          padding: 10px 16px 30px !important;
        }

        /* ── Cover: exactly 1 page ── */
        .cover {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          page-break-after: always !important;
          page-break-inside: avoid !important;
          max-height: 100vh !important;
          overflow: hidden !important;
        }

        /* ── TOC: keep together, then break ── */
        .toc {
          page-break-inside: avoid !important;
          page-break-after: always !important;
        }

        /* ── Section 2 (Diagram): force onto its own page ── */
        #s2ctx {
          page-break-before: always !important;
          page-break-after: avoid !important;
        }

        /* Swimlane SVG: constrain height so title + paragraph + SVG fit one landscape page */
        #s2ctx + p + div {
          page-break-inside: avoid !important;
          text-align: center !important;
        }
        #s2ctx + p + div svg {
          max-height: 245mm !important;
          width: auto !important;
          display: block !important;
          margin: 0 auto !important;
        }

        /* Info box after diagram: keep with diagram if it fits, or push to next page */
        #s2ctx ~ .info {
          page-break-inside: avoid !important;
        }

        /* ── Section 2.1 (APIs): new page ── */
        #s2 {
          page-break-before: always !important;
        }

        /* ── General rules ── */
        table { page-break-inside: avoid; }
        svg { page-break-inside: avoid; }
        pre { page-break-inside: avoid; }
        .endpoint-box { page-break-inside: avoid; }
        .info, .warn, .danger, .success { page-break-inside: avoid; }
        .firma-box { page-break-inside: avoid; }
        h1, h2, h3, h4 { page-break-after: avoid; }

        /* Ensure SVG diagrams scale properly */
        svg { max-width: 100% !important; height: auto !important; }
      }
    `,
  });

  // Generate PDF — portrait A4
  const outputPath = path.join(SERVE_DIR, OUTPUT_FILE);
  console.log('Generating PDF (portrait)...');

  await page.pdf({
    path: outputPath,
    format: 'A4',
    landscape: false,
    printBackground: true,
    preferCSSPageSize: false,
    margin: {
      top: '7mm',
      right: '7mm',
      bottom: '7mm',
      left: '7mm',
    },
    displayHeaderFooter: false,
  });

  console.log(`\nPDF generated: ${outputPath}`);

  await browser.close();
  server.close();
  console.log('Done!');
}

generatePDF().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});

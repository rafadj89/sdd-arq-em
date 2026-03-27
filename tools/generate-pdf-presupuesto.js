const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVE_DIR = path.resolve(__dirname, '../presupuesto');
const PORT = 9878;

// Get version from CLI args: node generate-pdf-presupuesto.js v2|v3|both
const arg = process.argv[2] || 'both';
const versions = arg === 'both' ? ['v2', 'v3'] : [arg];

function startServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = decodeURIComponent(req.url.split('?')[0]);
      if (filePath === '/') filePath = '/index.html';
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

async function generatePDF(browser, inputFile, outputFile) {
  console.log(`\nGenerating PDF: ${inputFile} -> ${outputFile}`);
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  const url = `http://localhost:${PORT}/${encodeURIComponent(inputFile)}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

  // Wait for Chart.js to render
  await page.waitForFunction(
    () => {
      const canvases = document.querySelectorAll('canvas');
      if (canvases.length === 0) return true;
      return Array.from(canvases).every((c) => c.getContext('2d').__chart !== undefined || c.width > 0);
    },
    { timeout: 15000 }
  ).catch(() => {});

  await new Promise((r) => setTimeout(r, 3000));

  // Inject print styles
  await page.addStyleTag({
    content: `
      @media print {
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .doc { padding: 10px 20px 30px !important; }
        .cover {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          page-break-after: always !important;
          page-break-inside: avoid !important;
        }
        table { page-break-inside: avoid; }
        .role-card { page-break-inside: avoid; }
        .phase-card { page-break-inside: avoid; }
        .chart-wrap { page-break-inside: avoid; }
        .kpi-grid { page-break-inside: avoid; }
        .pivot-wrap { page-break-inside: avoid; }
        .quote-exec { page-break-inside: avoid; }
        .info, .warn, .success { page-break-inside: avoid; }
        h1, h2, h3 { page-break-after: avoid; }
        .section-title { page-break-after: avoid; }
        svg { max-width: 100% !important; height: auto !important; }
        canvas { max-width: 100% !important; }
      }
    `,
  });

  const outputPath = path.join(SERVE_DIR, outputFile);
  await page.pdf({
    path: outputPath,
    format: 'A4',
    landscape: false,
    printBackground: true,
    preferCSSPageSize: false,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    displayHeaderFooter: false,
  });

  console.log(`PDF generated: ${outputPath}`);
  await page.close();
}

async function main() {
  const server = await startServer();
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const ver of versions) {
    const input = `presupuesto-electromovilidad-${ver}.html`;
    const output = `presupuesto-electromovilidad-${ver}.pdf`;
    await generatePDF(browser, input, output);
  }

  await browser.close();
  server.close();
  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVE_DIR = __dirname;
const PORT = 9876;
const INPUT_FILE = 'UPME-OCI-Well-Architected-Framework Min v2.html';
const OUTPUT_FILE = 'UPME-OCI-Well-Architected-Framework Min v2.pdf';
const DRAWIO_FILE = 'Arq UPME-To Be.drawio.html';
const DRAWIO_SCREENSHOT = path.join(SERVE_DIR, '_drawio-capture.png');

// Simple static file server
function startServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
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

// Step 1: Capture the draw.io diagram as a high-res PNG screenshot
async function captureDrawioDiagram(browser) {
  console.log('Step 1: Capturing draw.io diagram screenshot...');
  const diagramPage = await browser.newPage();

  // Use a wide viewport to capture the full diagram at high resolution
  await diagramPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

  const drawioUrl = `http://localhost:${PORT}/${encodeURIComponent(DRAWIO_FILE)}`;
  console.log(`  Loading ${DRAWIO_FILE}...`);
  await diagramPage.goto(drawioUrl, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });

  // Wait for draw.io viewer to fully render
  await new Promise((r) => setTimeout(r, 5000));

  // Try to find the diagram container and get its bounds
  const diagramBounds = await diagramPage.evaluate(() => {
    // draw.io viewer typically renders into a div with class 'geDiagramContainer' or similar
    const container = document.querySelector('.geDiagramContainer')
      || document.querySelector('.geViewer')
      || document.querySelector('svg')
      || document.body;
    const rect = container.getBoundingClientRect();
    return {
      x: Math.max(0, rect.x),
      y: Math.max(0, rect.y),
      width: rect.width,
      height: rect.height,
    };
  });

  console.log(`  Diagram bounds: ${JSON.stringify(diagramBounds)}`);

  // Take full page screenshot
  await diagramPage.screenshot({
    path: DRAWIO_SCREENSHOT,
    fullPage: true,
    type: 'png',
  });

  console.log(`  Screenshot saved: ${DRAWIO_SCREENSHOT}`);
  await diagramPage.close();

  // Convert to base64
  const imgBuffer = fs.readFileSync(DRAWIO_SCREENSHOT);
  const base64 = imgBuffer.toString('base64');
  console.log(`  Image size: ${(imgBuffer.length / 1024).toFixed(0)} KB`);
  return base64;
}

async function generatePDF() {
  const server = await startServer();

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // Step 1: Capture draw.io diagram
  const drawioBase64 = await captureDrawioDiagram(browser);

  // Step 2: Load the main document
  console.log('\nStep 2: Loading main document...');
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  await page.goto(`http://localhost:${PORT}/`, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });

  // Wait for Mermaid diagrams to render
  console.log('  Waiting for Mermaid diagrams to render...');
  await page.waitForFunction(
    () => {
      const mermaidDivs = document.querySelectorAll('.mermaid');
      if (mermaidDivs.length === 0) return true;
      return Array.from(mermaidDivs).every(
        (div) => div.querySelector('svg') !== null
      );
    },
    { timeout: 30000 }
  );

  // Extra wait for fonts and rendering
  await new Promise((r) => setTimeout(r, 3000));

  // Step 3: Replace iframe with captured screenshot image
  console.log('  Replacing iframe with captured diagram image...');
  await page.evaluate((base64Data) => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      const container = iframe.parentElement;

      // Create a full-page diagram section
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'page-break-before:always;page-break-after:always;text-align:center;padding:0;margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:90vh;';

      const title = document.createElement('p');
      title.style.cssText = 'font-size:0.85rem;font-weight:700;color:#0f172a;margin:0 0 8px;';
      title.textContent = 'Arq UPME-To Be — Arquitectura OCI To-Be — Primary Region Bogotá';

      const img = document.createElement('img');
      img.src = 'data:image/png;base64,' + base64Data;
      img.alt = 'Arquitectura OCI To-Be — UPME Electromovilidad';
      img.style.cssText = 'max-width:100%;max-height:85vh;object-fit:contain;border:1px solid #e2e8f0;border-radius:6px;';

      const caption = document.createElement('p');
      caption.style.cssText = 'font-size:0.68rem;color:#6b7280;margin:6px 0 0;';
      caption.textContent = 'Diagrama generado desde Arq UPME-To Be.drawio.html — OCI Primary Region Bogotá — Availability Domain — 3 Fault Domains';

      wrapper.appendChild(title);
      wrapper.appendChild(img);
      wrapper.appendChild(caption);

      // Replace the iframe's container
      container.replaceWith(wrapper);
    });
  }, drawioBase64);

  // Step 4: Inject print-optimized styles
  await page.addStyleTag({
    content: `
      @media print {
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .doc { padding: 10px 20px 30px !important; }
        
        /* Cover: exactly 1 page */
        .cover {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          page-break-after: always !important;
          page-break-inside: avoid !important;
          max-height: 100vh !important;
          overflow: hidden !important;
        }
        .cover h1 {
          page-break-before: avoid !important;
          page-break-after: avoid !important;
        }
        
        /* Footer: exactly 1 page */
        .pdf-footer {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          page-break-before: always !important;
          page-break-inside: avoid !important;
          max-height: 100vh !important;
          overflow: hidden !important;
        }
        
        /* Avoid breaking tables and diagrams across pages */
        table { page-break-inside: avoid; }
        .mermaid { page-break-inside: avoid; }
        svg { page-break-inside: avoid; }
        .g2 { page-break-inside: avoid; }
        .cd { page-break-inside: avoid; }
        h1, h2, h3, h4 { page-break-after: avoid; }
        
        /* Ensure SVG diagrams scale properly */
        svg { max-width: 100% !important; height: auto !important; }
      }
    `,
  });

  // Step 5: Generate PDF
  console.log('\nStep 3: Generating PDF...');
  const outputPath = path.join(SERVE_DIR, OUTPUT_FILE);

  await page.pdf({
    path: outputPath,
    format: 'A4',
    landscape: true,
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

  // Cleanup
  await browser.close();
  server.close();
  if (fs.existsSync(DRAWIO_SCREENSHOT)) fs.unlinkSync(DRAWIO_SCREENSHOT);
  console.log('Done!');
}

generatePDF().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});

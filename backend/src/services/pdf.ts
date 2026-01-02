import puppeteer, { Browser } from "puppeteer-core";
import { existsSync } from "fs";

export interface PdfOptions {
  format?: "A4";
  paddingMm?: number; // Padding in mm (default: 10)
  printBackground?: boolean;
  waitForSelector?: string;
  waitTimeout?: number;
}

let browserInstance: Browser | null = null;

function findChromePath(): string {
  const possiblePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];

  for (const chromePath of possiblePaths) {
    if (existsSync(chromePath)) {
      console.log(`[PDF] Found browser at: ${chromePath}`);
      return chromePath;
    }
  }
  throw new Error("Chrome/Chromium not found");
}

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    const executablePath = process.env.CHROME_PATH || findChromePath();
    console.log(`[PDF] Launching browser`);
    browserInstance = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }
  return browserInstance;
}

async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Generate PDF from HTML with automatic scaling and centering
 *
 * This function:
 * 1. Renders the HTML in a large viewport to measure true content size
 * 2. Calculates scale to fit content in A4 printable area
 * 3. Calculates offsets to center the content
 * 4. Injects CSS to apply the transform
 * 5. Generates the PDF
 */
export async function generatePdfFromHtml(
  html: string,
  options: PdfOptions = {}
): Promise<Buffer> {
  const {
    paddingMm = 10,
    printBackground = true,
    waitForSelector = "#report-page",
    waitTimeout = 30000,
  } = options;

  // A4 dimensions at 96 DPI
  const MM_TO_PX = 3.7795275591;
  const A4_W = 210 * MM_TO_PX; // ~794px
  const A4_H = 297 * MM_TO_PX; // ~1123px
  const paddingPx = paddingMm * MM_TO_PX;
  const printableW = A4_W - paddingPx * 2;
  const printableH = A4_H - paddingPx * 2;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Step 1: Set large viewport to measure content without constraints
    await page.setViewport({
      width: 2000,
      height: 4000,
      deviceScaleFactor: 1,
    });

    // Set HTML content
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: waitTimeout,
    });

    // Wait for selector
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: waitTimeout });
    }

    // Wait for fonts
    await page.evaluate(() => (document as any).fonts?.ready);
    await new Promise((r) => setTimeout(r, 500));

    // Step 2: Measure content dimensions with width constraint
    // Important: Constrain width to A4 printable area to prevent
    // content from expanding to fill the large viewport
    const contentSize = await page.evaluate(
      (selector: string, maxWidth: number) => {
        const el = document.querySelector(selector) as HTMLElement;
        if (!el) return { width: 0, height: 0 };

        // Save original styles
        const prev = {
          transform: el.style.transform,
          position: el.style.position,
          maxWidth: el.style.maxWidth,
          width: el.style.width,
        };

        // Temporarily modify for accurate measurement
        el.style.transform = "none";
        el.style.position = "static";
        el.style.maxWidth = `${maxWidth}px`;
        el.style.width = "auto";

        // Force reflow
        void el.offsetHeight;

        const rect = el.getBoundingClientRect();

        // Restore original styles
        el.style.transform = prev.transform;
        el.style.position = prev.position;
        el.style.maxWidth = prev.maxWidth;
        el.style.width = prev.width;

        return { width: rect.width, height: rect.height };
      },
      waitForSelector,
      printableW
    );

    console.log(
      `[PDF] Content size: ${contentSize.width.toFixed(
        0
      )}x${contentSize.height.toFixed(0)}px`
    );
    console.log(
      `[PDF] Printable area: ${printableW.toFixed(0)}x${printableH.toFixed(
        0
      )}px`
    );

    // Step 3: Calculate scale to fit
    const scaleW = printableW / contentSize.width;
    const scaleH = printableH / contentSize.height;
    const scale = Math.min(scaleW, scaleH, 1);

    // Calculate visual size after scaling
    const visualW = contentSize.width * scale;
    const visualH = contentSize.height * scale;

    // Calculate offset for PERFECT centering within full A4 page
    // Use full A4 dimensions for centering (not printable area)
    const offsetX = (A4_W - visualW) / 2;
    const offsetY = (A4_H - visualH) / 2;

    console.log(`[PDF] Scale: ${scale.toFixed(5)}`);
    console.log(
      `[PDF] Visual size: ${visualW.toFixed(0)}x${visualH.toFixed(0)}px`
    );
    console.log(
      `[PDF] Offset: X=${offsetX.toFixed(1)}px, Y=${offsetY.toFixed(1)}px`
    );

    // Step 4: Set viewport to A4 size
    await page.setViewport({
      width: Math.round(A4_W),
      height: Math.round(A4_H),
      deviceScaleFactor: 1,
    });

    // Step 5: Inject CSS to apply transform and centering
    await page.addStyleTag({
      content: `
        /* Override container - no flexbox, relative positioning */
        .print-a4, #report-area {
          width: ${A4_W}px !important;
          height: ${A4_H}px !important;
          padding: 0 !important;
          margin: 0 !important;
          position: relative !important;
          overflow: hidden !important;
          display: block !important;
        }
        
        /* Apply scale and position to content */
        #report-page {
          position: absolute !important;
          left: ${offsetX}px !important;
          top: ${offsetY}px !important;
          transform: scale(${scale}) !important;
          transform-origin: top left !important;
          margin: 0 !important;
        }
      `,
    });

    // Wait for styles to apply
    await new Promise((r) => setTimeout(r, 200));

    console.log(`[PDF] Generating PDF...`);

    // Step 6: Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    console.log(`[PDF] Done, size: ${pdfBuffer.length} bytes`);
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

export async function generatePdfFromUrl(
  url: string,
  options: PdfOptions = {}
): Promise<Buffer> {
  const { waitForSelector, waitTimeout = 10000 } = options;
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({
      width: 2000,
      height: 4000,
      deviceScaleFactor: 1,
    });

    await page.goto(url, { waitUntil: "networkidle0", timeout: waitTimeout });

    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: waitTimeout });
    }

    await page.evaluate(() => (document as any).fonts?.ready);
    await new Promise((r) => setTimeout(r, 500));

    const htmlContent = await page.content();
    await page.close();

    return generatePdfFromHtml(htmlContent, options);
  } catch (error) {
    await page.close();
    throw error;
  }
}

export const pdfService = {
  generateFromUrl: generatePdfFromUrl,
  generateFromHtml: generatePdfFromHtml,
  closeBrowser,
};

export default pdfService;

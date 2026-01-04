import { ref } from "vue";
// Dynamic import of pdfApi to avoid circular dependencies/module blocking
// import { pdfApi } from "@/services/api";

/**
 * Reusable PDF Export Composable
 *
 * Usage:
 * const { exportToPdf, pdfLoading } = usePdfExport()
 *
 * await exportToPdf({
 *   selector: '#report-page',
 *   filename: 'report.pdf',
 *   paddingMm: 10,
 * })
 */
export function usePdfExport() {
  const pdfLoading = ref(false);

  /**
   * Export an element to PDF
   * @param {Object} options
   * @param {string} options.selector - CSS selector for the element to capture
   * @param {string} options.filename - Output filename (default: 'report.pdf')
   * @param {number} options.paddingMm - Page padding in mm (default: 10)
   * @param {boolean} options.includeArabicFont - Include Arabic font (default: true)
   */
  async function exportToPdf({
    selector = "#report-page",
    filename = "report.pdf",
    paddingMm = 10,
    includeArabicFont = true,
  } = {}) {
    const element = document.querySelector(selector);
    if (!element) {
      console.error(`[PDF] Element not found: ${selector}`);
      throw new Error(`Element not found: ${selector}`);
    }

    // Helper to convert images to Base64
    async function convertImagesToBase64(element) {
      const images = element.querySelectorAll("img");
      const promises = Array.from(images).map(async (img) => {
        try {
          // If already base64, skip
          if (img.src.startsWith("data:")) return;

          // Fetch blob
          const response = await fetch(img.src);
          const blob = await response.blob();

          // Convert to base64
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              img.src = reader.result;
              resolve();
            };
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn("[PDF] Failed to convert image to base64:", img.src, e);
        }
      });
      await Promise.all(promises);
    }

    pdfLoading.value = true;
    try {
      // 1. Clone element to avoid modifying the DOM visibly
      const clone = element.cloneNode(true);

      // 2. Convert images in the clone
      await convertImagesToBase64(clone);

      // 3. Reset transforms on clone (if copied from source)
      clone.style.transform = "";
      clone.style.position = "";
      clone.style.left = "";
      clone.style.top = "";

      // 4. Get HTML from clone
      const contentHtml = clone.innerHTML;
      const className = element.className; // Use original class name

      console.log("[PDF] Sending HTML to backend for auto-scaling...");

      // Build HTML document with comprehensive CSS utilities
      const html = buildPdfHtml(contentHtml, {
        selector,
        includeArabicFont,
        className,
      });

      // Dynamic import to prevent initial load blocking
      const { pdfApi } = await import("@/services/api");

      const blob = await pdfApi.generateFromHtml(html, {
        paddingMm,
        waitForSelector: selector,
        printBackground: true,
        waitTimeout: 30000,
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename.replace(/\s+/g, "_");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("[PDF] Download complete:", filename);
    } catch (error) {
      console.error("[PDF] Export failed:", error);
      throw error;
    } finally {
      pdfLoading.value = false;
    }
  }

  return {
    exportToPdf,
    pdfLoading,
  };
}

/**
 * Build the complete HTML document for PDF generation
 */
function buildPdfHtml(
  contentHtml,
  { selector, includeArabicFont, className = "" }
) {
  const arabicFontLink = includeArabicFont
    ? '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">'
    : "";

  // Inject Latin font (Noto Sans) for consistent rendering on server
  const latinFontLink =
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap" rel="stylesheet">';

  // Extract element ID from selector (e.g., #report-page -> report-page)
  const elementId = selector.startsWith("#") ? selector.slice(1) : "content";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${latinFontLink}
  ${arabicFontLink}
  <style>
    /* Import Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Noto+Sans:wght@400;600;700&display=swap');

    /* Reset */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    html, body { 
      margin: 0; 
      padding: 0;
      /* Ensure Cairo is in the global stack for fallbacks */
      font-family: 'Noto Sans', 'Cairo', 'Arial', system-ui, -apple-system, sans-serif;
      background: white;
      font-size: 12px;
    }
    
    /* Arabic font - explicit override with fallback */
    .font-arabic { font-family: "Cairo", "Arial", "Segoe UI", sans-serif; }
    
    /* Container - backend will override with proper dimensions */
    .print-a4, #report-area, #print-area, #pdf-wrapper-root {
      background: white;
    }
    
    /* Content wrapper */
    #${elementId} {
      background: white;
      
      /* Clean UI: Remove app-like styling */
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
      
      /* Optimize Space: Remove container padding (rely on backend 10mm margin) */
      padding: 0 !important; 
    }
    
    /* Table styles */
    table { border-collapse: collapse; width: 100%; }
    th, td { padding: 4px 8px; text-align: left; vertical-align: middle; }
    
    /* Text utilities - use !important to override table defaults */
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .text-left { text-align: left !important; }
    [dir="rtl"] { text-align: right !important; }
    .text-xs { font-size: 10px; }
    .text-sm { font-size: 12px; }
    .text-base { font-size: 14px; }
    .text-lg { font-size: 16px; }
    .text-xl { font-size: 18px; }
    .text-2xl { font-size: 24px; }
    
    /* Font utilities */
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .uppercase { text-transform: uppercase; }
    .italic { font-style: italic; }
    
    /* Spacing */
    .mb-1 { margin-bottom: 4px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-4 { margin-bottom: 16px; }
    .mb-6 { margin-bottom: 24px; }
    .mb-11 { margin-bottom: 44px; }
    .mb-12 { margin-bottom: 48px; }
    .mt-2 { margin-top: 8px; }
    .mt-4 { margin-top: 16px; }
    .mt-6 { margin-top: 24px; }
    .mx-4 { margin-left: 16px; margin-right: 16px; }
    .ml-1 { margin-left: 4px; }
    .px-1 { padding-left: 4px; padding-right: 4px; }
    .px-2 { padding-left: 8px; padding-right: 8px; }
    .px-3 { padding-left: 12px; padding-right: 12px; }
    .px-4 { padding-left: 16px; padding-right: 16px; }
    .py-1 { padding-top: 4px; padding-bottom: 4px; }
    .py-2 { padding-top: 8px; padding-bottom: 8px; }
    .py-3 { padding-top: 12px; padding-bottom: 12px; }
    .pt-1 { padding-top: 4px; }
    .pt-4 { padding-top: 16px; }
    .pb-4 { padding-bottom: 16px; }
    .p-2 { padding: 8px; }
    .p-3 { padding: 12px; }
    .p-6 { padding: 24px; }
    
    /* Background */
    .bg-white { background: white; }
    .bg-slate-50 { background: #f8fafc; }
    .bg-slate-100 { background: #f1f5f9; }
    
    /* Colors */
    .text-slate-800 { color: #1e293b; }
    .text-slate-600 { color: #475569; }
    .text-slate-500 { color: #64748b; }
    .text-slate-400 { color: #94a3b8; }
    
    /* Grid */
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
    .grid-cols-12 { grid-template-columns: repeat(12, 1fr); }
    
    .col-span-1 { grid-column: span 1 / span 1; }
    .col-span-2 { grid-column: span 2 / span 2; }
    .col-span-3 { grid-column: span 3 / span 3; }
    .col-span-4 { grid-column: span 4 / span 4; }
    .col-span-5 { grid-column: span 5 / span 5; }
    .col-span-6 { grid-column: span 6 / span 6; }
    .col-span-7 { grid-column: span 7 / span 7; }
    .col-span-8 { grid-column: span 8 / span 8; }
    .col-span-9 { grid-column: span 9 / span 9; }
    .col-span-10 { grid-column: span 10 / span 10; }
    .col-span-11 { grid-column: span 11 / span 11; }
    .col-span-12 { grid-column: span 12 / span 12; }

    .gap-1 { gap: 4px; }
    .gap-2 { gap: 8px; }
    .gap-4 { gap: 16px; }
    
    /* Flex */
    .flex { display: flex; }
    .flex-1 { flex: 1; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .flex-col { flex-direction: column; }
    
    /* Width */
    .w-full { width: 100% !important; }
    .w-24 { width: 96px; }
    
    /* PDF Specific Wrapper */
    .pdf-page-wrapper {
        width: 210mm !important;
        min-height: 297mm !important;
        padding: 12mm !important;
        box-sizing: border-box !important;
        position: relative !important;
        margin-left: -10mm !important;
    }

    /* Status Colors */
    .bg-green-100 { background-color: #dcfce7 !important; }
    .text-green-700 { color: #15803d !important; }
    
    .bg-yellow-100 { background-color: #fef9c3 !important; }
    .text-yellow-700 { color: #a16207 !important; }
    
    .bg-blue-100 { background-color: #dbeafe !important; }
    .text-blue-700 { color: #1d4ed8 !important; }

    .bg-slate-100 { background-color: #f1f5f9 !important; }
    .text-slate-500 { color: #64748b !important; }

    /* Height */
    .h-full { height: 100%; }
    .h-auto { height: auto; }
    .min-h-full { min-height: 100%; }
    
    /* Fixed Height for Spacers/Signatures */
    .h-10 { height: 40px; }
    .h-12 { height: 48px; }
    .h-14 { height: 56px; }
    .h-16 { height: 64px; }
    .h-20 { height: 80px; }
    .h-24 { height: 96px; }
    .h-28 { height: 112px; }
    .h-32 { height: 128px; }

    /* Spacing Utilities */
    .mt-4 { margin-top: 16px; }
    .mt-6 { margin-top: 24px; }
    .mt-8 { margin-top: 32px; }
    .mt-10 { margin-top: 40px; }
    .mt-12 { margin-top: 48px; }
    .mt-16 { margin-top: 64px; }
    .mt-20 { margin-top: 80px; }
    .mt-24 { margin-top: 96px; }
    .mt-32 { margin-top: 128px; }

    .mb-4 { margin-bottom: 16px; }
    .mb-6 { margin-bottom: 24px; }
    .mb-8 { margin-bottom: 32px; }
    .mb-10 { margin-bottom: 40px; }
    .mb-12 { margin-bottom: 48px; }
    .mb-16 { margin-bottom: 64px; }
    
    /* Border utilities */
    .border { border: 1px solid #e2e8f0; }
    .border-b { border-bottom: 1px solid #e2e8f0; }
    .border-b-2 { border-bottom: 2px solid #1e293b; }
    .border-slate-300 { border-color: #cbd5e1; }
    .border-slate-800 { border-color: #1e293b; }
    .border-black { border-color: black; }
    .rounded { border-radius: 4px; }
    .rounded-lg { border-radius: 8px; }
    .rounded-xl { border-radius: 12px; }
    
    .border-slate-200 { border-color: #e2e8f0; }
    
    /* Table column handling */
    col { display: table-column; }
    colgroup { display: table-column-group; }
    
    /* Images */
    img { max-width: 100%; height: auto; }
    
    /* Print utilities */
    .print\\:hidden { display: none; }
    .overflow-x-auto { overflow-x: auto; }
    
    /* Badge-like elements */
    .rounded-full { border-radius: 9999px; }
    .px-2\\.5 { padding-left: 10px; padding-right: 10px; }
    .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
  </style>
</head>
<body>
  <div id="pdf-wrapper-root" class="print-a4">
    <div id="${elementId}" class="${className}">
      ${contentHtml}
    </div>
  </div>
</body>
</html>`;
}

export default usePdfExport;

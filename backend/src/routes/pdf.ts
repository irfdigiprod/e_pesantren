import { Hono } from "hono";
import { z } from "zod";
import { pdfService, type PdfOptions } from "../services/pdf";

const pdf = new Hono();

// Request schemas
const fromUrlSchema = z.object({
  url: z.string().url(),
  options: z
    .object({
      padding: z.number().min(0).max(50).optional(),
      printBackground: z.boolean().optional(),
      waitForSelector: z.string().optional(),
      waitTimeout: z.number().min(1000).max(60000).optional(),
    })
    .optional(),
});

const fromHtmlSchema = z.object({
  html: z.string().min(1),
  options: z
    .object({
      padding: z.number().min(0).max(50).optional(),
      printBackground: z.boolean().optional(),
      waitForSelector: z.string().optional(),
      waitTimeout: z.number().min(1000).max(60000).optional(),
    })
    .optional(),
});

/**
 * POST /api/pdf/from-url
 * Generate PDF from a URL with auto-scaling to fit A4
 */
pdf.post("/from-url", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = fromUrlSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: "Invalid request body",
          details: parsed.error.issues,
        },
        400
      );
    }

    const { url, options } = parsed.data;

    console.log(`[PDF] Generating PDF from URL: ${url}`);
    const startTime = Date.now();

    const pdfBuffer = await pdfService.generateFromUrl(
      url,
      options as PdfOptions
    );

    const elapsed = Date.now() - startTime;
    console.log(
      `[PDF] Generated in ${elapsed}ms, size: ${pdfBuffer.length} bytes`
    );

    // Return PDF as binary
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": pdfBuffer.length.toString(),
        "Content-Disposition": 'attachment; filename="document.pdf"',
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("[PDF] Error generating PDF from URL:", error);
    return c.json(
      {
        success: false,
        error: "Failed to generate PDF",
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/pdf/from-html
 * Generate PDF from HTML string with auto-scaling to fit A4
 */
pdf.post("/from-html", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = fromHtmlSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: "Invalid request body",
          details: parsed.error.issues,
        },
        400
      );
    }

    const { html, options } = parsed.data;

    console.log(`[PDF] Generating PDF from HTML (${html.length} chars)`);
    const startTime = Date.now();

    const pdfBuffer = await pdfService.generateFromHtml(
      html,
      options as PdfOptions
    );

    const elapsed = Date.now() - startTime;
    console.log(
      `[PDF] Generated in ${elapsed}ms, size: ${pdfBuffer.length} bytes`
    );

    // Return PDF as binary
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": pdfBuffer.length.toString(),
        "Content-Disposition": 'attachment; filename="document.pdf"',
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("[PDF] Error generating PDF from HTML:", error);
    return c.json(
      {
        success: false,
        error: "Failed to generate PDF",
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/pdf/health
 * Health check endpoint
 */
pdf.get("/health", (c) => {
  return c.json({
    success: true,
    service: "pdf",
    status: "ready",
  });
});

export default pdf;

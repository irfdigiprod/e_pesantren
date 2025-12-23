import { Hono } from "hono";

const utilsRoute = new Hono();

// URL regex pattern
const urlPattern =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

// Extract Open Graph metadata from HTML
function extractMetadata(html: string, url: string) {
  const getMetaContent = (property: string): string | null => {
    // Try og: prefix first
    const ogMatch = html.match(
      new RegExp(
        `<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`,
        "i"
      )
    );
    if (ogMatch && ogMatch[1]) return ogMatch[1];

    // Try content first then property (different attribute order)
    const ogMatch2 = html.match(
      new RegExp(
        `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`,
        "i"
      )
    );
    if (ogMatch2 && ogMatch2[1]) return ogMatch2[1];

    // Try twitter: prefix
    const twitterMatch = html.match(
      new RegExp(
        `<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']+)["']`,
        "i"
      )
    );
    if (twitterMatch && twitterMatch[1]) return twitterMatch[1];

    // Try standard meta name
    const metaMatch = html.match(
      new RegExp(
        `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`,
        "i"
      )
    );
    if (metaMatch && metaMatch[1]) return metaMatch[1];

    return null;
  };

  // Get title
  let title = getMetaContent("title");
  if (!title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : null;
  }

  // Get description
  let description = getMetaContent("description");

  // Get image
  let image = getMetaContent("image");

  // Get site name
  let siteName = getMetaContent("site_name");

  // Parse domain from URL
  let domain = "";
  try {
    const urlObj = new URL(url);
    domain = urlObj.hostname.replace("www.", "");
  } catch {
    domain = url;
  }

  return {
    title: title || domain,
    description: description || "",
    image: image || null,
    siteName: siteName || domain,
    domain,
    url,
  };
}

// GET /api/utils/link-preview?url=...
utilsRoute.get("/link-preview", async (c) => {
  const url = c.req.query("url");

  if (!url) {
    return c.json(
      {
        success: false,
        message: "URL parameter is required",
      },
      400
    );
  }

  // Validate URL format
  if (!url.match(urlPattern)) {
    return c.json(
      {
        success: false,
        message: "Invalid URL format",
      },
      400
    );
  }

  try {
    // Fetch the URL with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Only process HTML content
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      // For non-HTML (like images, PDFs), return basic info
      return c.json({
        success: true,
        data: {
          title: url.split("/").pop() || url,
          description: `File: ${contentType}`,
          image: contentType.includes("image") ? url : null,
          siteName: new URL(url).hostname,
          domain: new URL(url).hostname,
          url,
        },
      });
    }

    const html = await response.text();
    const metadata = extractMetadata(html, url);

    return c.json({
      success: true,
      data: metadata,
    });
  } catch (error: any) {
    console.error("[Link Preview] Error fetching URL:", error.message);

    // Return minimal data even on error
    let domain = "";
    try {
      domain = new URL(url).hostname;
    } catch {
      domain = url;
    }

    return c.json({
      success: true,
      data: {
        title: domain,
        description: "",
        image: null,
        siteName: domain,
        domain,
        url,
      },
    });
  }
});

export default utilsRoute;

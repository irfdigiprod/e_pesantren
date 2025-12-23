import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import path from "path";
import fs from "fs";

const uploads = new Hono();

// Ensure uploads directory exists
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
const ALLOWED_MIME_TYPES: Record<
  string,
  { extensions: string[]; maxSize: number }
> = {
  image: {
    extensions: ["jpg", "jpeg", "png", "gif", "webp"],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  document: {
    extensions: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"],
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  audio: {
    extensions: ["mp3", "wav", "ogg", "m4a", "aac"],
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  video: {
    extensions: ["mp4", "webm", "mov", "avi", "mkv"],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
};

// Create subdirectories for each file type
function ensureDirectories() {
  const dirs = ["image", "document", "audio", "video"];
  dirs.forEach((dir) => {
    const dirPath = path.join(UPLOAD_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

ensureDirectories();

// Get file type from extension
function getFileType(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  for (const [type, config] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (config.extensions.includes(ext)) {
      return type;
    }
  }
  return null;
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}.${ext}`;
}

// Upload file endpoint
uploads.post("/", authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ success: false, message: "No file uploaded" }, 400);
    }

    // Validate file type
    const fileType = getFileType(file.name);
    if (!fileType) {
      return c.json(
        {
          success: false,
          message: "File type not allowed",
          allowedTypes: Object.entries(ALLOWED_MIME_TYPES).map(
            ([type, config]) => ({
              type,
              extensions: config.extensions,
            })
          ),
        },
        400
      );
    }

    // Validate file size
    const maxSize = ALLOWED_MIME_TYPES[fileType]?.maxSize || 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json(
        {
          success: false,
          message: `File too large. Max size for ${fileType}: ${
            maxSize / (1024 * 1024)
          }MB`,
        },
        400
      );
    }

    // Generate filename and save path
    const filename = generateFilename(file.name);
    const filePath = path.join(UPLOAD_DIR, fileType, filename);
    const relativePath = `uploads/${fileType}/${filename}`;

    // Save file to disk
    const buffer = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    // Return file info - attachment record will be created when message is sent
    return c.json({
      success: true,
      data: {
        fileName: filename,
        originalName: file.name,
        filePath: relativePath,
        fileType,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        url: `/api/uploads/${fileType}/${filename}`,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ success: false, message: "Upload failed" }, 500);
  }
});

// Serve uploaded files
uploads.get("/:type/:filename", async (c) => {
  try {
    const { type, filename } = c.req.param();

    // Validate file type
    if (!["image", "document", "audio", "video"].includes(type)) {
      return c.json({ success: false, message: "Invalid file type" }, 400);
    }

    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, type, sanitizedFilename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return c.json({ success: false, message: "File not found" }, 404);
    }

    // Read file and return
    const fileBuffer = fs.readFileSync(filePath);
    const ext = sanitizedFilename.split(".").pop()?.toLowerCase() || "";

    // Set content type
    const mimeTypes: Record<string, string> = {
      // Images
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      // Audio
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      aac: "audio/aac",
      // Video
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      mkv: "video/x-matroska",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    return c.body(fileBuffer, 200, {
      "Content-Type": contentType,
      "Content-Length": fileBuffer.length.toString(),
      "Cache-Control": "public, max-age=31536000", // Cache for 1 year
    });
  } catch (error) {
    console.error("Serve file error:", error);
    return c.json({ success: false, message: "Failed to serve file" }, 500);
  }
});

// Delete file endpoint (for cleanup)
uploads.delete("/:type/:filename", authMiddleware, async (c) => {
  try {
    const { type, filename } = c.req.param();

    if (!["image", "document", "audio", "video"].includes(type)) {
      return c.json({ success: false, message: "Invalid file type" }, 400);
    }

    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, type, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      return c.json({ success: false, message: "File not found" }, 404);
    }

    fs.unlinkSync(filePath);

    return c.json({ success: true, message: "File deleted" });
  } catch (error) {
    console.error("Delete file error:", error);
    return c.json({ success: false, message: "Failed to delete file" }, 500);
  }
});

export default uploads;

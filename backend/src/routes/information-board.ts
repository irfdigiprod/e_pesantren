import { Hono } from "hono";
import { db } from "../db";
import { informationBoard } from "../db/schema/information-board";
import { eq, desc, count } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const route = new Hono();

// GET /api/information-board
route.get("/", async (c) => {
  try {
    const data = await db.query.informationBoard.findMany({
      orderBy: [desc(informationBoard.createdAt)],
    });
    return c.json({ success: true, data });
  } catch (e) {
    return c.json({ success: false, message: "Failed to fetch images" }, 500);
  }
});

// POST /api/information-board
route.post("/", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return c.json({ success: false, message: "Image URL required" }, 400);
    }

    // Check count
    const [result] = await db.select({ count: count() }).from(informationBoard);

    if (result.count >= 7) {
      return c.json(
        {
          success: false,
          message:
            "Maksimal 7 gambar diperbolehkan. Silakan hapus gambar lama terlebih dahulu.",
        },
        400
      );
    }

    await db.insert(informationBoard).values({ imageUrl });
    return c.json({ success: true, message: "Image added" });
  } catch (e) {
    console.error(e);
    return c.json({ success: false, message: "Failed to add image" }, 500);
  }
});

// DELETE /api/information-board/:id
route.delete("/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id))
      return c.json({ success: false, message: "Invalid ID" }, 400);

    await db.delete(informationBoard).where(eq(informationBoard.id, id));
    return c.json({ success: true, message: "Image deleted" });
  } catch (e) {
    return c.json({ success: false, message: "Failed to delete image" }, 500);
  }
});

export default route;

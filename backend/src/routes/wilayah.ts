import { Hono } from "hono";

const app = new Hono();

const WILAYAH_API = "https://wilayah.id/api";

// GET /provinces - List all provinces
app.get("/provinces", async (c) => {
  try {
    const res = await fetch(`${WILAYAH_API}/provinces.json`);
    const data = await res.json();
    return c.json(data);
  } catch (e: any) {
    console.error("Failed to fetch provinces:", e);
    return c.json({ success: false, message: e.message }, 500);
  }
});

// GET /regencies/:provinceCode - Get regencies by province code
app.get("/regencies/:provinceCode", async (c) => {
  const provinceCode = c.req.param("provinceCode");
  try {
    const res = await fetch(`${WILAYAH_API}/regencies/${provinceCode}.json`);
    const data = await res.json();
    return c.json(data);
  } catch (e: any) {
    console.error("Failed to fetch regencies:", e);
    return c.json({ success: false, message: e.message }, 500);
  }
});

// GET /districts/:regencyCode - Get districts by regency code
app.get("/districts/:regencyCode", async (c) => {
  const regencyCode = c.req.param("regencyCode");
  try {
    const res = await fetch(`${WILAYAH_API}/districts/${regencyCode}.json`);
    const data = await res.json();
    return c.json(data);
  } catch (e: any) {
    console.error("Failed to fetch districts:", e);
    return c.json({ success: false, message: e.message }, 500);
  }
});

// GET /villages/:districtCode - Get villages by district code
app.get("/villages/:districtCode", async (c) => {
  const districtCode = c.req.param("districtCode");
  try {
    const res = await fetch(`${WILAYAH_API}/villages/${districtCode}.json`);
    const data = await res.json();
    return c.json(data);
  } catch (e: any) {
    console.error("Failed to fetch villages:", e);
    return c.json({ success: false, message: e.message }, 500);
  }
});

export default app;

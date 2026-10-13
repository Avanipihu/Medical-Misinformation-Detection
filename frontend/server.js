// Tiny server: serves the built React app and proxies /api/* to the FastAPI backend,
// adding the secret X-API-Key server-side so it never reaches the browser.
// Same-origin for the browser => no CORS changes needed on the backend.
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_URL = (process.env.BACKEND_URL ||
  "https://medical-misinformation-detection-2d80.onrender.com").replace(/\/$/, "");
const API_KEY = process.env.API_KEY || "";
const PORT = process.env.PORT || 8080;

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

async function forward(res, url, init) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 90_000); // Render free tier cold start
  try {
    const upstream = await fetch(url, { ...init, signal: ctrl.signal });
    const body = await upstream.text();
    res.status(upstream.status).type("application/json").send(body);
  } catch (err) {
    res.status(502).json({ detail: "Backend unreachable" });
  } finally {
    clearTimeout(timer);
  }
}

app.get("/api/health", (_req, res) => forward(res, `${BACKEND_URL}/health`, {}));

app.post("/api/predict", (req, res) => {
  const text = req.body?.text;
  if (typeof text !== "string" || !text.trim() || text.length > 20000) {
    return res.status(422).json({ detail: "Text must be 1-20,000 characters." });
  }
  if (!API_KEY) return res.status(500).json({ detail: "Proxy API_KEY is not configured" });
  forward(res, `${BACKEND_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify({ text }),
  });
});

app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

app.listen(PORT, () => console.log(`MedVerify on :${PORT} -> ${BACKEND_URL}`));

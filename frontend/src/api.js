const MAX = 20000;

async function request(path, init, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(path, { ...init, signal: ctrl.signal });
    const raw = await res.text();
    let data = null;
    try { data = JSON.parse(raw); } catch {}
    if (data === null || typeof data !== "object") {
      throw new Error(`Unexpected (non-JSON) response from ${path} [HTTP ${res.status}]: ${raw.slice(0, 80)}`);
    }
    if (!res.ok) {
      const detail = Array.isArray(data.detail) ? data.detail[0]?.msg : data.detail;
      throw new Error(detail || `Request failed (${res.status})`);
    }
    return data;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("The service is taking too long to respond (it may be waking up). Please try again.");
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export const MAX_CHARS = MAX;
export const getHealth = () => request("/api/health", {}, 90000);
export const predict = async (text) => {
  const r = await request("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }, 90000);
  if (typeof r.prediction !== "string" || (r.label !== 0 && r.label !== 1) || typeof r.confidence !== "number") {
    throw new Error(`Unexpected prediction response: ${JSON.stringify(r).slice(0, 120)}`);
  }
  return r;
};

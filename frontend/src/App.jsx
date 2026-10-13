import { useEffect, useState } from "react";
import { getHealth, predict, MAX_CHARS } from "./api.js";

const HISTORY_KEY = "medverify.history.v1";
const EXAMPLES = [
  "Vaccines contain microchips to track your location.",
  "Washing your hands with soap helps reduce the spread of respiratory infections.",
  "Drinking bleach cures COVID-19.",
];

// Real held-out test-set results from model/metrics.json
const METRICS = {
  accuracy: 94.6, macroF1: 90.9, rocAuc: 97.96,
  recallMis: 91.2, precisionMis: 79.8,
  cm: [[427, 21], [8, 83]], test: 539,
};

const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
};
const saveHistory = (h) => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch {} };

function StatusPill({ status }) {
  const map = {
    checking: ["API checking…", "pill-warn"],
    online: ["API online", "pill-ok"],
    degraded: ["Model not loaded", "pill-bad"],
    offline: ["API offline", "pill-bad"],
  };
  const [label, cls] = map[status];
  return <span className={`pill ${cls}`}><i /> {label}</span>;
}

function Result({ r }) {
  const mis = r.label === 1;
  const pct = (r.confidence * 100).toFixed(2);
  return (
    <section className={`card result ${mis ? "mis" : "ok"}`} aria-live="polite">
      <div className="eyebrow">Analysis result</div>
      <h3>{mis ? "Potential misinformation" : "Likely accurate"}</h3>
      <p>The model classified this claim as <b>{r.prediction}</b>.</p>
      <div className="conf-head"><span>Model confidence</span><b>{pct}%</b></div>
      <div className="bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin="0" aria-valuemax="100">
        <div style={{ width: `${pct}%` }} />
      </div>
      <dl className="facts">
        <div><dt>Predicted label</dt><dd>{r.prediction}</dd></div>
        <div><dt>Class</dt><dd>{r.label} ({mis ? "misinformation" : "accurate"})</dd></div>
        <div><dt>Confidence</dt><dd>{r.confidence}</dd></div>
      </dl>
      <p className="note">This is a statistical prediction, not verified fact-checking and not medical advice.</p>
    </section>
  );
}

export default function App() {
  const [status, setStatus] = useState("checking");
  const [modelName, setModelName] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(loadHistory);

  useEffect(() => {
    getHealth()
      .then((h) => { setStatus(h.model_loaded ? "online" : "degraded"); setModelName(h.model_name); })
      .catch(() => setStatus("offline"));
  }, []);

  async function analyze(e) {
    e.preventDefault();
    const claim = text.trim();
    if (!claim) return setError("Please enter a medical claim to analyze.");
    if (claim.length > MAX_CHARS) return setError(`Text is too long (max ${MAX_CHARS.toLocaleString()} characters).`);
    setError(""); setLoading(true); setResult(null);
    try {
      const r = await predict(claim);
      setResult(r);
      setStatus("online");
      const next = [{ id: Date.now(), text: claim.slice(0, 300), prediction: r.prediction, label: r.label, confidence: r.confidence, at: new Date().toISOString() }, ...history].slice(0, 10);
      setHistory(next); saveHistory(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const clearHistory = () => { setHistory([]); saveHistory([]); };
  const tooLong = text.length > MAX_CHARS;

  return (
    <>
      <header className="top">
        <div className="wrap row">
          <div className="brand">
            <span className="logo">+</span>
            <div><b>MedVerify AI</b><small>Medical Claim Intelligence</small></div>
          </div>
          <StatusPill status={status} />
        </div>
      </header>

      <main className="wrap">
        <section className="hero">
          <div className="eyebrow">AI-powered claim analysis</div>
          <h1>Before you believe it, verify it.</h1>
          <p>Analyze medical claims using machine learning to identify potentially misleading health information.</p>
        </section>

        <div className="grid">
          <form className="card" onSubmit={analyze}>
            <label htmlFor="claim" className="label">Paste a medical claim</label>
            <textarea
              id="claim" rows={8} value={text}
              onChange={(e) => { setText(e.target.value); if (error) setError(""); }}
              placeholder="Enter a health claim, online medical post, or statement you want to analyze…"
            />
            <div className="meta">
              <span>Text only · Maximum 20,000 characters</span>
              <span className={tooLong ? "bad" : ""}>{text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}</span>
            </div>
            <div className="examples">
              Try: {EXAMPLES.map((ex) => (
                <button type="button" key={ex} onClick={() => { setText(ex); setError(""); }}>{ex.slice(0, 34)}…</button>
              ))}
            </div>
            {error && <div className="error" role="alert">{error}</div>}
            <button className="primary" disabled={loading || tooLong}>
              {loading ? <><span className="spin" /> Analyzing…</> : "Analyze Medical Claim"}
            </button>
            {loading && status !== "online" && <p className="hint">The server may be waking up — the first request can take up to a minute.</p>}
          </form>

          <div>
            {result ? <Result r={result} /> : (
              <section className="card empty">
                <div className="eyebrow">Analysis result</div>
                <p>Your result will appear here, with the predicted label and the model's confidence.</p>
              </section>
            )}
          </div>
        </div>

        <section className="card">
          <div className="sec-head">
            <h2>Recent analyses</h2>
            {history.length > 0 && <button className="link" onClick={clearHistory}>Clear history</button>}
          </div>
          {history.length === 0 ? <p className="muted">Nothing yet. History is stored only in this browser — avoid pasting personal medical details.</p> : (
            <ul className="history">
              {history.map((h) => (
                <li key={h.id}>
                  <button onClick={() => { setText(h.text); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <span className={`tag ${h.label ? "mis" : "ok"}`}>{h.prediction}</span>
                    <span className="ht">{h.text}</span>
                    <span className="hc">{(h.confidence * 100).toFixed(1)}%</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>About the model</h2>
          <p className="muted">
            {modelName || "TF-IDF + Logistic Regression"} trained on the CoAID dataset (COVID-19 news, 2020).
            Figures below are from the held-out test set ({METRICS.test} samples).
          </p>
          <div className="stats">
            <div><b>{METRICS.accuracy}%</b><span>Accuracy</span></div>
            <div><b>{METRICS.macroF1}%</b><span>Macro F1</span></div>
            <div><b>{METRICS.rocAuc}%</b><span>ROC AUC</span></div>
            <div><b>{METRICS.recallMis}%</b><span>Misinformation recall</span></div>
          </div>
          <p className="note">
            Limitations: the model was trained on COVID-19 related news, so it may be unreliable for other health topics.
            It judges writing patterns, not factual truth. Results are not medical advice or independent fact verification.
          </p>
        </section>
      </main>

      <footer className="wrap foot">MedVerify AI · Educational project · Not medical advice</footer>
    </>
  );
}

# MedVerify AI — Frontend

React + Vite UI for the Medical Misinformation Detection API. Lives in its own folder; **the backend is not modified.**

```
Browser → this app's server.js (/api/predict, /api/health) → FastAPI on Render
                         └─ adds the secret X-API-Key server-side
```

Because the browser only talks to its own origin, no CORS change is needed and the API key never reaches the browser.

## Run locally
```bash
cd frontend
npm install
npm run build
API_KEY=your-backend-key npm start       # http://localhost:8080
```
For hot reload: run `npm run dev:server` in one terminal and `npm run dev` in another.

## Deploy on Render (new Web Service, separate from the backend)
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment: `API_KEY` = your backend's API key; `BACKEND_URL` = `https://medical-misinformation-detection-2d80.onrender.com` (optional, this is the default)

On Render's free tier the backend sleeps when idle, so the first request can take up to a minute.

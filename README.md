# MedVerify AI

## Medical Misinformation Detection Using Machine Learning

MedVerify AI is a web application that screens COVID-19-related news
text using a machine-learning classifier. It returns a predicted
label---**Accurate** or **Misinformation**---and a model-derived
confidence score.

> **Responsible use:** This is an educational screening tool, not a
> medical fact-checker. Predictions are not proof that a claim is true
> or false and must not be used as medical advice.

## Overview

The project combines a TF-IDF text vectoriser and Logistic Regression
classifier with a FastAPI REST API and a React/Vite interface. An
Express server serves the built frontend and proxies requests to the
backend, adding the API key server-side so it is not exposed in browser
code.

### Features

-   Submit a COVID-19-related claim for classification.
-   View the predicted label, numeric class, and model confidence score.
-   Check backend service/model status.
-   Try example claims and view recent prediction history stored in
    browser local storage.
-   Clear local history.
-   Protect prediction requests with an `X-API-Key` header.
-   Run automated API tests through GitHub Actions.
-   Build a Docker image for the backend.

## Architecture

``` text
User
  |
  v
React + Vite Frontend
  |
  v
Express Server / Same-origin API Proxy
  |  Adds X-API-Key server-side
  v
FastAPI Backend
  |-- GET /health
  |-- POST /predict
  v
TF-IDF Vectoriser + Logistic Regression
  |
  v
Prediction + Label + Model Score
```

The browser sends requests to `/api/health` and `/api/predict` on the
frontend server. Express forwards them to the configured backend URL.
The API key is read from the server's `API_KEY` environment variable
rather than included in browser JavaScript.

## Technology Stack

  Component                 Technology
  ------------------------- -------------------------------------------
  Frontend                  React 18, Vite, JavaScript
  Frontend server/proxy     Node.js, Express
  Backend                   Python, FastAPI, Uvicorn
  Machine learning          scikit-learn, TF-IDF, Logistic Regression
  Model artifact            `model/model.pkl`
  API schemas               Pydantic
  Authentication            API key via `X-API-Key`
  Containerisation          Docker
  CI/CD                     GitHub Actions
  Deployment instructions   Render

## Machine Learning Method

The pipeline uses TF-IDF to transform text into numerical features and
Logistic Regression to classify the text.

Recorded configuration: - Word unigrams and bigrams. - Maximum of 50,000
TF-IDF features. - Sublinear term-frequency scaling. -
`class_weight="balanced"`. - `C=1.0`, `max_iter=2000`. - Stratified
train/validation/test split with random seed `42`.

The training split is used for fitting and the validation split for
development decisions. The production artifact is fitted on combined
training and validation data; the test set is held out for final
evaluation.

    Numeric label Display label
  --------------- ----------------
              `0` Accurate
              `1` Misinformation

The confidence score is model-derived. It is not proof of factual
correctness and should not be assumed calibrated without separate
testing.

## Dataset and Evaluation

Project documentation identifies the source as eight CoAID COVID-19 news
CSV parts: four `NewsFakeCOVID-19` files and four `NewsRealCOVID-19`
files.

  Dataset detail                              Recorded value
  ----------------------------------------- ----------------
  Raw rows                                             5,457
  After deduplication and anomaly removal              5,388
  Training records                                     4,310
  Validation records                                     539
  Test records                                           539
  Accurate records after cleaning                      4,478
  Misinformation records after cleaning                  910
  Records with usable publication dates                  181

Text is constructed from title, abstract, and content fields. Records
without usable text and exact duplicate normalised text are removed;
three anomalous pre-2020 records are excluded. Available publication
dates span 6 January 2020 to 3 November 2020 UTC.

### Held-out test results

Reported in `model/metrics.json` for 539 test records:

  Metric                                   Result
  ------------------ ----------------------------
  Accuracy                                 94.62%
  Macro precision                          0.8898
  Macro recall                             0.9326
  Macro F1-score                           0.9092
  ROC-AUC                                  0.9796
  Confusion matrix     TN=427, FP=21, FN=8, TP=83

These results apply only to the documented dataset and split. They do
not establish performance for all medical topics, languages, platforms,
or current claims.

## Project Structure

``` text
.
├── app/
│   ├── main.py                 # FastAPI routes and application setup
│   ├── model.py                # Model loading and prediction
│   ├── schemas.py              # Request/response schemas
│   └── security.py              # API-key validation
├── model/
│   ├── model.pkl                # Trained model pipeline
│   └── metrics.json             # Dataset and evaluation metrics
├── data/
│   └── processed/               # Processed dataset splits
├── tests/
│   └── TEST_FASTAPI_ENDPOINTS.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # React UI
│   │   └── api.js               # Frontend API client
│   ├── server.js                # Express server and proxy
│   ├── package.json
│   └── README.md
├── .github/workflows/
│   └── ci-cd.yml                # Tests and Docker image build
├── Dockerfile                   # Backend container
├── requirements.txt
├── ACCESS_INSTRUCTIONS.md
└── MEMBER_3_CICD.md
```

This is a summary of the documented main files; local copies may contain
additional files.

## Getting Started

### Prerequisites

-   Python 3.12 and pip
-   Node.js and npm
-   Docker (optional, for container execution)
-   Git

### 1. Run the Backend

From the repository root, create and activate a virtual environment.

**Windows PowerShell**

``` powershell
python -m venv .venv
.venv\\Scripts\\Activate.ps1
```

**macOS/Linux**

``` bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

``` bash
pip install -r requirements.txt
```

Set a development API key.

**Windows PowerShell**

``` powershell
$env:API_KEY="replace-with-a-long-random-secret"
```

**macOS/Linux**

``` bash
export API_KEY="replace-with-a-long-random-secret"
```

Start the API:

``` bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open: - Health: `http://localhost:8000/health` - Interactive API
documentation: `http://localhost:8000/docs`

The application expects the trained model at `model/model.pkl`.

### 2. Run the Frontend

In a second terminal:

``` bash
cd frontend
npm install
```

Set `API_KEY` and `BACKEND_URL` for the Express server. For local
development, `BACKEND_URL` should point to `http://localhost:8000`, and
`API_KEY` must match the backend key.

Build and start the frontend:

``` bash
npm run build
npm start
```

The documented frontend server uses port `8080` by default. Open
`http://localhost:8080`. Check `frontend/README.md` and
`frontend/package.json` for the exact scripts and configuration in your
checkout.

### 3. Run the Backend with Docker

From the repository root:

``` bash
docker build -t medverify-ai-backend .
docker run --rm -p 8000:8000 -e API_KEY="replace-with-a-long-random-secret" medverify-ai-backend
```

Then check `http://localhost:8000/health`.

## Environment Variables

  ------------------------------------------------------------------------------
  Variable                Service                 Purpose
  ----------------------- ----------------------- ------------------------------
  `API_KEY`               Backend and Express     Secret used to protect
                          server                  prediction requests. Configure
                                                  the same value in both
                                                  services.

  `BACKEND_URL`           Express server          Base URL of the FastAPI
                                                  backend,
                                                  e.g. `http://localhost:8000`
                                                  locally.
  ------------------------------------------------------------------------------

Use environment variables or your hosting provider's secret settings.
Never commit real secrets or expose them in browser-side code.

## API Endpoints

### `GET /health`

Returns service status, model-loaded status, and model name. It is
public in the documented implementation.

``` bash
curl http://localhost:8000/health
```

### `POST /predict`

Accepts a JSON request with a non-empty `text` field and requires a
valid `X-API-Key` header.

``` bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -H "X-API-Key: replace-with-a-long-random-secret" \
  -d '{"text":"Example COVID-19 news claim to screen"}'
```

The response includes prediction, label, and confidence fields. See
`/docs` for the exact schema in the running version.

## Testing

API tests are located in `tests/TEST_FASTAPI_ENDPOINTS.py`. They
cover: - Health endpoint and model-loading status. - Rejection of
prediction requests without a key. - Rejection of an incorrect key. -
Successful prediction with a valid key and expected response fields.

Run from the repository root:

``` bash
pytest
```

For end-to-end verification, also build and run the Docker image, build
and start the frontend, and submit a claim through the browser.

## CI/CD

The `.github/workflows/ci-cd.yml` workflow is configured to: 1. Check
out the repository. 2. Set up Python 3.12. 3. Install backend
dependencies. 4. Run API tests with a test API key. 5. Configure Docker
Buildx. 6. Build the backend Docker image.

**The documented workflow tests the backend and builds an image.** It
does not currently establish that the image is published to a registry
or that the application is automatically deployed to the cloud.

## Deployment Status

The repository contains instructions for deploying the frontend as a
separate Render Web Service:

-   Root directory: `frontend`
-   Build command: `npm install && npm run build`
-   Start command: `npm start`
-   `BACKEND_URL`: URL of the deployed FastAPI backend
-   `API_KEY`: secret configured in the service environment

The project documentation references
`https://medical-misinformation-detection-2d80.onrender.com` as a
backend URL. Repository configuration alone does not prove that the URL
is current or that both services are live. Verify the frontend, backend,
and full browser-to-proxy-to-backend flow before claiming a successful
deployment.

A complete cloud monitoring dashboard and alert configuration are not
established by the reviewed repository. Monitoring of service health,
latency, HTTP errors, resource usage, and logs remains future work
unless implemented separately.

## Team Responsibilities

  Member     Main responsibility
  ---------- ----------------------------------------
  Member 1   Machine-learning model and FastAPI API
  Member 2   Docker containerisation
  Member 3   CI/CD and GitHub Actions
  Member 4   Cloud deployment and monitoring

The React interface and Express proxy also need clear ownership if they
are not already included in a member's responsibilities.

## Limitations and Responsible Use

-   The classifier is trained on a specific COVID-19 news dataset, not a
    continuously updated medical knowledge base.
-   It does not retrieve current medical guidance or cite authoritative
    evidence.
-   It does not replace healthcare professionals, researchers,
    journalists, or professional fact-checkers.
-   Predictions and confidence scores do not prove a claim is true or
    false.
-   Dataset imbalance, label noise, writing style, source-specific
    patterns, and changes in language may affect results.
-   Publication dates are available for only a small subset of records;
    the dataset reflects a limited period in 2020.
-   Confidence calibration has not been established by the reported
    metrics alone.

Use this project for educational demonstration and preliminary screening
only. Consult trusted public-health sources and qualified healthcare
professionals for medical decisions.

## Future Improvements

-   Configure Docker image publishing and automated cloud deployment.
-   Add structured logging, service metrics, dashboards, and alerts.
-   Evaluate on newer and more diverse medical-news datasets.
-   Analyse false positives and false negatives and assess confidence
    calibration.
-   Add source citations and retrieval from trusted public-health
    references, clearly separating model predictions from verified
    evidence.
-   Monitor data drift and introduce a human-review workflow before
    higher-stakes use.

## License and Data Attribution

This README does not assert a software license. Add a `LICENSE` file if
you intend to publish the repository for reuse. Follow applicable terms
and attribution requirements for the CoAID dataset, dependencies, and
third-party resources.


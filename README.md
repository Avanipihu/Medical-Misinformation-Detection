# MedVerify AI: Medical Misinformation Detection

**MedVerify AI** is a machine learning text-classification application that identifies whether COVID-19-related news text resembles the accurate-news or misinformation class. The system combines a TF-IDF vectoriser and a Logistic Regression classifier with a FastAPI REST API and a React and Vite web interface.

---

##  Features

* **Machine Learning Classification**: The model pipeline combines TF-IDF text vectorisation (word unigrams and bigrams, maximum of 50,000 features, and sublinear term-frequency scaling) with a Logistic Regression classifier (`class_weight='balanced'`, $C=1.0$, and `max_iter=2000`).


* **FastAPI Backend**: The backend exposes `/health` and `/predict` endpoints and is secured with API-key authentication using the `X-API-Key` header. Interactive Swagger documentation is automatically available at `/docs`.


* **React Frontend & Express Proxy**: Branded "MedVerify AI" with the subtitle "Medical Claim Intelligence", the frontend provides a text area for claims, a 20,000-character limit, example claim buttons, loading states, error messages, service-status indicators, and recent local history storage. An Express server serves the built frontend and proxies browser requests to the backend while adding the `X-API-Key` server-side to prevent exposing secrets in browser code.


* **Containerisation & CI/CD**: The backend is containerised using a Dockerfile based on `python:3.12-slim`. A GitHub Actions workflow sets up Python 3.12, installs requirements, runs `pytest` with a test API key, and builds the backend Docker image.



---

##  Model Performance

Evaluated on a held-out test set of 539 records from the documented dataset split, the model reports the following results:

* **Test Accuracy**: 94.62%


* **Macro Precision**: 0.8898


* **Macro Recall**: 0.9326


* **Macro F1-Score**: 0.9092


* **ROC-AUC**: 0.9796



---

##  System Architecture & File Structure

* `app/main.py`: Handles FastAPI routes and application initialisation.


* `app/model.py`: Manages model loading and prediction.


* `app/schemas.py`: Contains API request and response schemas.


* `app/security.py`: Implements API-key authentication.


* `model/model.pkl`: Stores the trained classifier pipeline.


* `model/metrics.json`: Records dataset details and evaluation metrics.


* `frontend/`: Contains the React UI (`src/App.jsx`), API client (`src/api.js`), and Express static server/proxy (`server.js`).


* `Dockerfile`: Handles backend container building.


* `.github/workflows/ci-cd.yml`: Defines CI tests and Docker image builds.



---

##  Getting Started & Local Setup

### 1. Backend Setup

1. Install backend requirements using the command `pip install -r requirements.txt`.


2. Configure your environment variables to include the required `API_KEY`.


3. Start the FastAPI backend by running `uvicorn app.main:app --host 0.0.0.0 --port 8000`.


4. Verify the service health at `/health` and access the interactive documentation at `/docs`.



### 2. Running Tests

Run the backend API tests using `pytest` to verify that API-key validation functions as expected.

### 3. Frontend Setup

1. Navigate to the `frontend/` directory.


2. Install dependencies by running `npm install`.


3. Configure the environment variables `API_KEY` and `BACKEND_URL` (where the documented default backend URL is `[https://medical-misinformation-detection-2d80.onrender.com](https://medical-misinformation-detection-2d80.onrender.com)`).


4. Build and start the frontend using `npm run build` followed by `npm start`.



---

##  Running with Docker

1. Build the backend Docker container using the provided `Dockerfile`.


2. Run the container while passing the required `API_KEY` environment variable.



---

##  Limitations and Responsible Use

* This application is a supervised text classifier trained on a specific historical COVID-19 news dataset and time period spanning 6 January 2020 to 3 November 2020 UTC.


* The system does not retrieve current medical guidance, cite source evidence, verify claims against authoritative medical literature, or replace expert review.


* Model output represents a statistical prediction and a model-derived probability score rather than definitive fact-checking or medical recommendations.

# Youth Mental Wellness — GenAI Companion (Sakhi)

This project is a hackathon MVP for a GenAI-powered mental wellness companion named "Sakhi", designed for Indian youth. It provides an anonymous, culturally-sensitive, and privacy-first chat interface.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend**: Python, Flask
- **LLM**: Local CodeLlama (dev), Google Gemini (prod)
- **Database**: IndexedDB (client-side, ephemeral), SQLite/Firestore (opt-in)
- **Deployment**: Vercel (frontend), Render/Railway (backend), Docker

## Project Structure

```
/
├── backend/
│   ├── app/
│   │   ├── routes/       # Flask Blueprints for each API endpoint
│   │   ├── llm/          # LLM client integrations
│   │   ├── safety/       # Safety and content filtering modules
│   │   └── utils/        # Utility functions (e.g., encryption)
│   ├── app.py            # Main Flask app setup
│   ├── Dockerfile        # Docker container for backend
│   └── requirements.txt  # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/        # Top-level page components
│   │   ├── components/   # Reusable UI components
│   │   ├── lib/          # API clients, utility functions
│   │   └── hooks/        # Custom React hooks
│   ├── package.json      # Node.js dependencies
│   └── vite.config.ts    # Vite build configuration
│
├── docker-compose.yml    # Local development environment
└── README.md             # This file
```

---

## Local Development Setup

### Prerequisites

- Node.js (v18+) and npm
- Python (v3.9+) and pip
- Docker and Docker Compose
- An internet connection to download dependencies.

### 1. Backend Setup

Navigate to the `backend` directory and set up the Python environment.

```bash
# Navigate to backend folder
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows (PowerShell/CMD):
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Frontend Setup

Navigate to the `frontend` directory in a separate terminal.

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install
```

---

## Running the Application

### Using Docker Compose (Recommended for Local Dev)

This is the easiest way to run both the frontend and backend services together.

```bash
# From the project root directory
docker-compose up --build
```

- Frontend will be available at `http://localhost:5173`
- Backend will be available at `http://localhost:8080`

### Running Services Manually

If you prefer not to use Docker, you can run each service in a separate terminal.

**Terminal 1: Run Backend**

```bash
# In the /backend directory (with venv activated)
# Set environment variables for development
# On Windows (PowerShell):
$env:FLASK_APP = "app.py"
$env:FLASK_ENV = "development"
$env:BACKEND_LLM = "local"

# On macOS/Linux:
# export FLASK_APP=app.py
# export FLASK_ENV=development
# export BACKEND_LLM=local

# Run the Flask server
flask run
```

**Terminal 2: Run Frontend**

```bash
# In the /frontend directory
npm run dev
```

---

## Production Notes

- **LLM Client**: The backend is configured to use a local stub by default (`BACKEND_LLM=local`). For production, switch to the Gemini client by setting the environment variable `BACKEND_LLM=gemini` and providing the necessary `GEMINI_API_KEY`.
- **Mood Scale Guardrail (optional)**: Set `SAKHI_MOOD_NORMALIZE=true` to enforce strict mapping between mood label and score server-side (e.g., "sad" → score ≤ 4, "happy" → score ≥ 8). Default is off to keep outputs purely AI-driven.
- **Session**: The backend issues a stable session id per server run at `/api/session` and sets a 7‑day cookie. The frontend includes credentials on API calls to preserve chat history.
- **Database**: The default mode is ephemeral, using client-side IndexedDB. To enable persistent storage, the backend database connection needs to be configured (e.g., to Firestore or an encrypted SQLite database) and the frontend `api.ts` needs to be updated to handle user consent for persistence.
- **Security**: Ensure all production environment variables (API keys, secret keys) are stored securely and not hardcoded.
- **CORS**: The development Flask server allows all origins. For production, tighten the `CORS` configuration in `app.py` to only allow your frontend's domain.

---

## Deploy to Cloud Run (GitHub UI)

Use a single Cloud Run service that serves the Flask API and the prebuilt SPA.

1) Prep the repo (done in this branch)
- Root `Dockerfile` builds frontend then runs Flask via Gunicorn on `$PORT`.
- `.dockerignore` and `.gcloudignore` minimize build context; secrets excluded.
- Backend uses Firebase Admin via ADC. Do not commit `serviceAccountKey.json`.

2) Configure GCP prerequisites
- Create a GCP project and enable: Cloud Run, Cloud Build, Artifact Registry, Secret Manager, Firestore (Native) if using cloud features.
- Create an Artifact Registry repo (format: Docker) in your region (e.g., `us-central1`).
- Option A (recommended): Use Workload Identity Federation + ADC in Cloud Run.
- Option B: Store a Service Account JSON in Secret Manager and mount as file.

3) Connect GitHub repo to Cloud Run
- Console → Cloud Run → Create Service → Deployment platform: Source repository.
- Connect GitHub and select this repo/branch `main`.
- Build config: Dockerfile at `/Dockerfile` (root). No buildpacks.
- Service settings:
	- Region: choose near users.
	- CPU/Memory: start with 1 vCPU / 512–1024 MB.
	- Min instances: 0; Max instances: start 10.
	- Ingress: Allow all (or internal + authorized if needed).
	- Authentication: Allow unauthenticated (frontend SPA + public APIs) or require auth as needed.

4) Set runtime environment variables (Container → Variables & Secrets)
- `GEMINI_API_KEY` (use Secret Manager; required for Gemini replies)
- `FLASK_SECRET_KEY` (random string; or Secret Manager)
- `SAKHI_MOOD_NORMALIZE` (optional: `true`/`false`)
- `ALLOWED_ORIGINS` (comma-separated prod origins; include your Cloud Run URL)

5) Configure Firebase Admin credentials
- Preferred: Grant Cloud Run service account the Firebase/Firestore roles; rely on ADC (`Application Default Credentials`). No file needed.
- If using Secret Manager JSON:
	- Create secret `FIREBASE_SA` with the JSON content.
	- In Cloud Run → Service → Volumes: Add Secret volume `firebase-sa` → mount path `/var/secrets/firebase`.
	- Add env var `GOOGLE_APPLICATION_CREDENTIALS=/var/secrets/firebase/FIREBASE_SA`.

5) Provide Firebase Web SDK config at runtime (recommended)
- No need to commit frontend env files. Backend serves `/config.js` which populates `window.__RUNTIME_CONFIG__`.
- Set either:
	- A single secret/env `FIREBASE_WEB_CONFIG` with JSON like:
		`{ "apiKey":"...", "authDomain":"...", "projectId":"...", "storageBucket":"...", "messagingSenderId":"...", "appId":"...", "measurementId":"..." }`
	- Or individual envs: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `FIREBASE_MEASUREMENT_ID`
- The frontend reads this at runtime before booting.

6) Deploy
- Click Create. First build may take a few minutes.
- After deploy, open the service URL and verify the SPA and `/api/*` endpoints.
- Health check: GET `/api/health` should return `{ "status": "ok" }`.

7) CI/CD trigger (optional)
- Cloud Run creates a Cloud Build trigger on the selected branch. Pushes to `main` will auto-deploy.

Troubleshooting
- 404s on client routes: ensure SPA fallback in backend is active (already configured).
- CORS errors: set `ALLOWED_ORIGINS` to your Cloud Run URL and custom domain.
- 401 on auth endpoints: ensure Firebase Web SDK uses the correct web keys, and Cloud Run has Firebase Admin permissions.
- “Auth not configured” in UI: your Vite Firebase envs were not available at build time. Use step 5.

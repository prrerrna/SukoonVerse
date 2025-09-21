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

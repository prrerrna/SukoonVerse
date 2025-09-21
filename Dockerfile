## Root Dockerfile building frontend + backend for single Cloud Run service

# ---------- Frontend build ----------
FROM node:20-alpine AS frontend-build
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* frontend/pnpm-lock.yaml* frontend/yarn.lock* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then npm -g i pnpm && pnpm install --frozen-lockfile; \
    else npm ci || npm install; fi
COPY frontend .
# Ensure Vite sees env at build time (optional)
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID
RUN npm run build

# ---------- Backend runtime ----------
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=app.py \
    FLASK_RUN_HOST=0.0.0.0

WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ /app/

# Copy built frontend into Flask static dir
RUN mkdir -p /app/static
COPY --from=frontend-build /frontend/dist/ /app/static/

EXPOSE 8080

# Run via gunicorn; Cloud Run provides $PORT
CMD ["sh", "-c", "gunicorn -b 0.0.0.0:${PORT:-8080} app:app"]

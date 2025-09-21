## Root Dockerfile building frontend + backend for single Cloud Run service

# ---------- Frontend build ----------
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* frontend/pnpm-lock.yaml* frontend/yarn.lock* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then npm -g i pnpm && pnpm install --frozen-lockfile; \
    else npm ci || npm install; fi
COPY frontend .
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

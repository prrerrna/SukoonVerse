# Dockerfile: Containerizes the Flask backend for deployment and development.
# Use an official Python runtime as a parent image
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY ../frontend/package.json ../frontend/package-lock.json* ../frontend/pnpm-lock.yaml* ../frontend/yarn.lock* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
	elif [ -f pnpm-lock.yaml ]; then npm -g i pnpm && pnpm install --frozen-lockfile; \
	else npm ci || npm install; fi
COPY ../frontend .
RUN npm run build

FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application's code to the working directory
COPY . .
# Copy built frontend into static folder served by Flask
RUN mkdir -p /app/static
COPY --from=frontend-build /frontend/dist /app/static

# Make port 5000 available to the world outside this container
EXPOSE 8080

# Define environment variable
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Run app.py when the container launches
# Bind to Cloud Run's dynamic PORT (default 8080)
CMD ["sh", "-c", "gunicorn -b 0.0.0.0:${PORT:-8080} app:app"]

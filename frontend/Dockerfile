# Multi-stage Dockerfile for HireGenie AI Frontend (React 18 + Vite + Tailwind CSS)

# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build arguments for Vite environment variables
ARG VITE_API_URL=http://localhost:8000
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ARG VITE_SARVAM_AGENT_ID=agent_b5f25bf1_976e_4938_bb94_12b2a647b6a1

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SARVAM_AGENT_ID=$VITE_SARVAM_AGENT_ID

# Compile TypeScript and build production bundle
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:1.25-alpine AS production

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built static assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for client-side routing & reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

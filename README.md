# Farm2Value web app

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/harshinikumar28-5806s-projects/v0-farm2-value-web-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/iQPpI3YEwyJ)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/harshinikumar28-5806s-projects/v0-farm2-value-web-app](https://vercel.com/harshinikumar28-5806s-projects/v0-farm2-value-web-app)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/iQPpI3YEwyJ](https://v0.app/chat/iQPpI3YEwyJ)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Weather APIs (integrated)

### 1) Seasonal Forecast (Open‑Meteo)
- Endpoint: `GET /api/seasonal-weather`
- Query params:
  - `latitude` (required)
  - `longitude` (required)
  - `start` (YYYY-MM-DD, optional; defaults to 1st of current month)
  - `end` (YYYY-MM-DD, optional; defaults to end of 3rd month window)
  - `temperature_2m_max`, `precipitation_sum`, `timezone` (optional)
- Example:
  - `/api/seasonal-weather?latitude=12.97&longitude=77.59&start=2025-12-01&end=2026-02-28&temperature_2m_max=true&precipitation_sum=true&timezone=Asia/Kolkata`

UI integration:
- Component `components/seasonal-weather.tsx` auto-detects browser location and renders a summary on the dashboard (`components/dashboard.tsx`).

### 2) Current Weather (OpenWeather)
- Endpoint: `GET /api/current-weather`
- Query params:
  - `lat` (or `latitude`) required
  - `lon` (or `longitude`) required
  - `units` (default `metric`)
- Example:
  - `/api/current-weather?lat=12.97&lon=77.59&units=metric`
- Requires env var:
  - `OPENWEATHER_API_KEY=your_key`

## Model API (Flask)
- Train model: `python train_model.py` (creates PKLs in repo root)
- Run API: `python api.py` (defaults to `http://127.0.0.1:5000`)
- Next.js backend route `app/api/predict-yield/route.ts` posts to `POST /predict`
- Configure Next with env var:
  - `FLASK_API_URL=http://127.0.0.1:5000`

## Local Dev Quickstart
1. Start Flask (model):
   - `python api.py`
2. Start Next.js:
   - `npm install`
   - `npm run dev`
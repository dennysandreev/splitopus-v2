# Splitopus V2 - Status Report

## 🎯 Goal
A Telegram Mini App for expense splitting (like Splitwise).
Stack: React + Vite + TailwindCSS (Frontend) / Python + FastAPI (Backend) / SQLite.

## ✅ Completed Milestones
- **SQL Migration:** Fully replaced JSON storage with SQLite (`src/schema.sql`, `src/db.py`).
- **Backend Refactor:** Bot logic now uses `src/db.py` directly.
- **Repository Setup:** Created monorepo `splitopus-v2` (`backend/` + `frontend/`).
- **API Development:** Implemented `api.py` with FastAPI (`/trips`, `/expenses`).
- **Test Environment:** Launched V2 bot locally with test token.
- **Bug Fix:** Fixed `KeyError: 'ts'` in Notes feature (DB column name mismatch).

## 🚧 In Progress
- **Frontend Integration:** connecting React app to FastAPI backend.
- **Dockerizing V2:** adding `api` service to `docker-compose.yml`.
- **Deploy:** Moving V2 to Production Server (`79.137.205.107`).

## 🐞 Known Issues
- None critical at the moment.

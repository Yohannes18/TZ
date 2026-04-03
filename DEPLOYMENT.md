# Deployment Guide

This repo is now aligned for a split deployment:

- Frontend: Vercel
- Backend API: Render
- Database: Supabase Postgres

## 1) Frontend on Vercel

Deploy the repository root.

Build settings:

- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`

Frontend environment variables:

- `VITE_API_URL=https://your-render-service.onrender.com`

The SPA rewrite is already handled by [vercel.json](./vercel.json).

## 2) Backend on Render

Create a Render Web Service from the `backend/` directory, or use [render.yaml](./render.yaml).

Recommended settings:

- Root directory: `backend`
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/health`

Required backend environment variables:

- `NODE_ENV=production`
- `DATABASE_URL=postgresql://...`
- `DB_SSL=true`
- `DB_SSL_MODE=require`
- `DB_SSL_REJECT_UNAUTHORIZED=false`
- `JWT_SECRET=...`
- `SESSION_SECRET=...`
- `FRONTEND_URL=https://your-vercel-app.vercel.app`
- `CORS_ORIGIN=https://your-vercel-app.vercel.app`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `GOOGLE_CALLBACK_URL=https://your-render-service.onrender.com/api/auth/google/callback`
- `SMTP_HOST=...`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `SMTP_FROM="TradeZella" <noreply@yourdomain.com>`

Notes:

- The backend now supports either `DATABASE_URL` or the older split `DB_*` variables.
- Supabase usually works best on Render with SSL enabled and `DB_SSL_REJECT_UNAUTHORIZED=false`.
- The app runs DB migrations during backend startup.

## 3) Database on Supabase

In Supabase, create a project and use the Postgres connection string from the project settings as `DATABASE_URL`.

If you prefer not to use a single connection string, you can still provide:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

For production with Supabase, still set:

- `DB_SSL=true`
- `DB_SSL_MODE=require`
- `DB_SSL_REJECT_UNAUTHORIZED=false`

## 4) Google OAuth

In Google Cloud, add these authorized URLs:

- Authorized JavaScript origin: `https://your-vercel-app.vercel.app`
- Authorized redirect URI: `https://your-render-service.onrender.com/api/auth/google/callback`

Set the same redirect URI in `GOOGLE_CALLBACK_URL`.

## 5) Production Checklist

- Set strong secrets for `JWT_SECRET` and `SESSION_SECRET`
- Point `FRONTEND_URL` and `CORS_ORIGIN` to the exact Vercel domain
- Confirm the backend health check passes at `/health`
- Confirm the frontend can reach the backend using `VITE_API_URL`
- Verify signup/login, Google OAuth, and password reset flows after deploy

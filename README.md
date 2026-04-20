# Shamba Tracker

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Build Status](https://img.shields.io/badge/build-passing-success.svg)
![Environment](https://img.shields.io/badge/env-production-success.svg)

Shamba Tracker is a cloud-native Agricultural Management Information System (AMIS). It provides a secure, role-based platform for agricultural administrators and field agents to track crop lifecycles, manage farm plots, and isolate regional data streams.

---

## Architecture Overview

The platform utilizes a decoupled authentication architecture, separating identity management from relational business logic.

* **Identity Provider (IdP):** Google Firebase Authentication (Client-side JWT generation).
* **Application Gateway:** Node.js / Express.js REST API (Stateless token verification via Firebase Admin SDK).
* **Relational Persistence:** PostgreSQL hosted on Google Cloud SQL.
* **Client Interface:** React.js powered by the Vite build engine.

---

## Project Structure

This repository is configured as a monorepo. Deployment pipelines must target the respective root directories (`/frontend` or `/backend`).

```text
shamba-tracker/
├── backend/                # API Gateway & Business Logic
│   ├── routes/             # REST endpoints (users, fields, updates)
│   ├── db.js               # Cloud SQL pooling & SSL configuration
│   ├── firebase.js         # Admin SDK initialization
│   └── server.js           # Application entry point
├── frontend/               # React SPA
│   ├── src/                
│   │   ├── components/     # Reusable UI primitives
│   │   └── firebase.js     # Client IdP configuration
│   ├── vite.config.js      # Build configuration
│   └── package.json        
└── .gitignore              # Global security & artifact exclusion
```

---

## Getting Started

### 1. Prerequisites
* Node.js (v18.0.0 or higher)
* Git
* A provisioned PostgreSQL instance (Local or Google Cloud SQL)
* Google Firebase Project (Email/Password Auth enabled)

### 2. Environment Configuration

The application requires strict environment variable configurations. **Never commit `.env` files to version control.** Create a `.env` file in the `/backend` directory:

| Variable | Description | Example / Source |
| :--- | :--- | :--- |
| `PORT` | API listening port | `5000` |
| `PG_HOST` | Database IP Address | `34.xx.xxx.xxx` |
| `PG_USER` | Database User | `postgres` |
| `PG_PASSWORD` | Database Password | `********` |
| `PG_DATABASE` | Target Database Name | `postgres` |
| `PG_PORT` | Database Port | `5432` |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | `shambarecords-traker` |
| `FIREBASE_PRIVATE_KEY` | Admin SDK RSA Key | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `FIREBASE_CLIENT_EMAIL`| Service Account Email | `firebase-adminsdk-***@...` |

Create a `.env` file in the `/frontend` directory:

| Variable | Description | Example / Source |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend Endpoint | `http://localhost:5000` or `https://api.render.com` |
| `VITE_FIREBASE_API_KEY`| Client Web API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN`| Auth Domain | `shambarecords.firebaseapp.com` |

### 3. Local Development

**Initialize the API:**
```bash
cd backend
npm install
npm run dev
```
*The server will boot on port 5000 and verify Cloud SQL and Firebase Admin connectivity.*

**Initialize the Client:**
Open a new terminal session:
```bash
cd frontend
npm install
npm run dev
```
*The Vite development server will boot on port 5173.*

---

## Production Deployment Specifications

### API Deployment (Render)
* **Build Environment:** Node
* **Root Directory:** `backend`
* **Build Command:** `npm install`
* **Start Command:** `node server.js`
* **Networking:** Ensure the Render deployment IP ranges (`0.0.0.0/0`) are whitelisted in the Google Cloud SQL Authorized Networks.

### Client Deployment (Vercel)
* **Framework Preset:** Vite
* **Root Directory:** `frontend`
* **Security:** The resulting Vercel deployment URL must be added to the **Authorized Domains** list within the Firebase Authentication console to permit cross-origin sign-ins.

---

## Security & Compliance

* **Stateless Authorization:** The backend relies entirely on Firebase-signed JWTs passed via the `Authorization: Bearer <token>` header. Session states are not maintained on the server.
* **Database Encryption:** Connections to Google Cloud SQL enforce SSL (`rejectUnauthorized: false` for development/MVP lifecycle) to encrypt data in transit.
* **Role-Based Access Control (RBAC):** Agent data isolation is enforced at the PostgreSQL query level via the verified `uid` extracted from the Firebase token.

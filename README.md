# CBK DESIGNFOLIO — Visual Artist & Creative Director

A high-performance cinematic portfolio and dynamic Content Management System (Backstage CMS) engineered for **C. Bala Krishnan** (Creative Director & Visual Artist).

Featuring an interactive 3D Visual Orbit gallery, high-framerate canvas stream hero section, fluid custom cursor dynamics, interactive 3D models (Three.js / OGL), and an administrative Backstage CMS.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (optional for local testing)
cp .env.example .env

# 3. Start the local server
npm start
```

Open your browser to:
- **Portfolio Website:** `http://localhost:3000`
- **Backstage CMS:** `http://localhost:3000/backstage`

---

## ⚡ Deploying to Vercel

This repository is pre-configured for zero-friction, production deployment on **Vercel** with native serverless function routing.

### 1. Import Repository
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Select and import **`krishnan-creator/Designfolio`**.
4. Framework Preset: Leave as **Other** (configured via `vercel.json`).
5. Output Directory: Leave default (`.` / root).

### 2. Configure Environment Variables in Vercel
In the Vercel project settings (**Settings** -> **Environment Variables**), add:

| Key | Description | Example / Default |
|---|---|---|
| `BACKSTAGE_PASSWORD` | Administrative passphrase for Backstage CMS | Any strong passphrase |
| `GMAIL_USER` | Gmail address for 2FA OTP login | `project2krishnan@gmail.com` |
| `GMAIL_APP_PASSWORD` | 16-character Google App Password | `xxxx xxxx xxxx xxxx` |
| `BLOB_READ_WRITE_TOKEN` | *(Optional)* Vercel Blob Token for CMS persistence & direct uploads | Auto-populated by Vercel Blob |

> **Note on Persistence:** Without `BLOB_READ_WRITE_TOKEN`, the site runs in secure zero-config read-only mode using bundled data (`data/content.json`). To enable live CMS editing and 10GB direct media uploads on Vercel, simply connect a free **Vercel Blob** database in your Vercel project under **Storage -> Blob**.

---

## 📂 Project Architecture

```
├── api/
│   └── index.js             # Vercel Serverless Function entry point
├── data/
│   ├── content.json         # Master published portfolio content & manifest
│   └── content-draft.json   # Backstage draft content
├── frames/                  # Sequential hero stream frames (frame_00001.jpg - frame_00291.jpg)
├── index.html               # Main portfolio application
├── backstage.html           # Backstage administrative CMS
├── server.js                # Core Node.js HTTP request handler & API routes
├── storage-adapter.js       # Production storage abstraction (Local fs / Vercel Blob)
├── vercel.json              # Vercel serverless rewrites and static configuration
├── package.json             # Scripts, engines, and production dependencies
└── .env.example             # Documented environment template
```

---

## 🛡️ Security & Privacy
- Sensitive files (`.env`, `.env.*`, `data/auth.json`) are strictly ignored via `.gitignore` and must never be committed.
- Two-factor authentication (Gmail OTP gateway & RFC 6238 TOTP Authenticator) is built into Backstage.
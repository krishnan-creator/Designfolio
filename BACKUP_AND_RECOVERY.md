# CBK DESIGNFOLIO — BACKUP AND RECOVERY MANUAL

**Generated Checkpoint Date:** 2026-10-23 16:35 IST  
**Git Branch:** `main`  
**Checkpoint Commit Hash:** `cfc47f7857393225f6fd124b1c180f48b02ba060`  
**Git Remote:** `https://github.com/vautlabs-cpu/Portfolio-website.git`  
**Backup Archive:** `CBK-DESIGNFOLIO-BACKUP-2026-10-23-1635.zip` (6.47 GB / 6,949,670,264 bytes)  
**Backup Folder:** `c:\Users\meet2\Desktop\CBK-DESIGNFOLIO-BACKUP-2026-10-23-1635`  
**Archive SHA-256 Checksum:** `f77bf1f372f33ab79a7ab1fe5f4fb6f29aa3ccd44d075daee0f9b1091296181e`  
**Checksum File:** `c:\Users\meet2\Desktop\CBK-DESIGNFOLIO-BACKUP-2026-10-23-1635.zip.sha256`  

---

## 1. Overview & Verification Status

This document describes how to restore and verify the exact, verified working state of the **CBK Designfolio** as established at this checkpoint.

### Regression Checks Completed & Passed
- **Portfolio & Theme**: All 7 core sections (`hero-section`, `beyond-the-frame-zone`, `selected-works`, `my-expertise`, `the-core`, `hobbies-archive`, `lets-build`) render correctly in both Dark and Light themes.
- **Project Cards & Experience**: Removed category tags remain removed; `IMPROMP2LABS` is identified as a PSD-backed creative venture; company info is legible in both themes.
- **Video Playback**: All 9 portfolio video assets load and stream properly with byte-range requests; the unwanted subtitle/metadata line (`"Feature Cinema // DNEG Generative AI Pipeline"`) is completely removed from all cards, previews, and fullscreen lightbox views; fullscreen controls, Escape key, and bottom-left exit button work as expected.
- **Footer & Contact**: Mjölnir 3D hammer model loads cleanly without any golden lightning or electrical charge effects; intro copy displays as exactly two lines on desktop; all three contact buttons (`[ LET'S CONNECT ]`, `[ WhatsApp ]`, `[ LinkedIn ]`) sit on a single horizontal row with 12px spacing; contact form validation and submission pathways are intact.
- **Backstage CMS & Auth**: Protected route `/backstage` loads with administrative challenge and authentication enforcement; content visibility settings and content persistence are verified.
- **Console & Build**: Zero console errors or runtime exceptions.

---

## 2. Prerequisites & Environment Setup

### System Requirements
- **Node.js**: Version 18.x or 20.x LTS
- **Package Manager**: npm 9.x+ (or pnpm/yarn)
- **Supported OS**: Windows 10/11, macOS, Linux

### Environment Variables
For security, credentials and secret values are **NEVER** stored in the repository or backup archives. Use `.env.example` as a template to create your `.env` file with your actual values:

| Variable Name | Purpose | Example / Notes |
| :--- | :--- | :--- |
| `PORT` | Local web server port | `3000` |
| `BACKSTAGE_PASSWORD` | Administrative passphrase for CMS `/backstage` | Secure passphrase |
| `GMAIL_USER` | Gmail address for sending OTP emails | `yourname@gmail.com` |
| `GMAIL_APP_PASSWORD` | Google App Password for Gmail SMTP | 16-character App Password |
| `SMTP_HOST` | Custom SMTP host (if not using Gmail) | `smtp.example.com` |
| `SMTP_PORT` | Custom SMTP port | `587` or `465` |
| `SMTP_USER` | Custom SMTP username | `user@example.com` |
| `SMTP_PASS` | Custom SMTP password | Secure password |
| `SMTP_FROM` | Sender email address for inquiries | `inquiries@domain.com` |
| `RESEND_API_KEY` | Resend API key for transaction delivery | `re_...` |
| `EMAIL_FROM` | Sender address for Resend | `onboarding@resend.dev` |
| `SESSION_SECRET` | Secret key for signing CMS session tokens | 32+ character random string |

---

## 3. How to Restore from the Backup Archive

### Step 1: Extract the Archive
Extract the archive file `CBK-DESIGNFOLIO-BACKUP-2026-10-23-1635.zip` to your desired destination folder:
```bash
# Using Windows PowerShell / bsdtar:
tar -xf "C:\Users\meet2\Desktop\CBK-DESIGNFOLIO-BACKUP-2026-10-23-1635.zip" -C "C:\path\to\target-folder"

# Or on macOS / Linux:
unzip CBK-DESIGNFOLIO-BACKUP-2026-10-23-1635.zip -d /path/to/target-folder
```

### Step 2: Verify Archive Integrity (Optional but Recommended)
Verify the archive SHA-256 checksum before running:
```powershell
# PowerShell
Get-FileHash -Algorithm SHA256 "C:\Users\meet2\Desktop\CBK-DESIGNFOLIO-BACKUP-2026-10-23-1635.zip"
```
Compare the resulting hash with the contents of `CBK-DESIGNFOLIO-BACKUP-2026-10-23-1635.zip.sha256`.

### Step 3: Install Dependencies
Navigate into the extracted project directory and install the required Node.js packages:
```bash
cd /path/to/target-folder
npm install
```

### Step 4: Configure Local Environment
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

### Step 5: Start the Application
Start the local server:
```bash
npm start
# or
node server.js
```
Open `http://localhost:3000` in your web browser.

---

## 4. How to Return to this Checkpoint Using Git

To return to this exact verified state in Git without losing or destroying later work:

### Non-Destructive Inspection (Detached HEAD)
```bash
git checkout cfc47f7857393225f6fd124b1c180f48b02ba060
```

### Branching from Checkpoint
Create a new branch starting from this verified checkpoint:
```bash
git switch -c restore-checkpoint-2026-10-23 cfc47f7857393225f6fd124b1c180f48b02ba060
```

### Hard Reset (Overwriting Working Branch)
> [!CAUTION]
> This command will discard all uncommitted changes and subsequent commits on the current branch:
```bash
git reset --hard cfc47f7857393225f6fd124b1c180f48b02ba060
```

---

## 5. External Services & Separate Backup Requirements

The local project backup and Git repository preserve all application code, CMS schemas, content databases (`data/content.json`), static assets, and video files. However, the following external items are not stored in the repository and must be maintained separately:

1. **Production Hosting Environment Variables**:
   - Vercel / Railway / Cloudflare dashboard environment variables must be backed up through their respective provider export tools.
2. **External Email / SMTP Service Credentials**:
   - Gmail App Passwords and Resend API keys should be stored in a secure password manager (e.g. 1Password, Bitwarden).
3. **Third-Party CDN / External Hosted Assets**:
   - Any external CDN assets referenced via external URLs (such as Three.js CDN scripts or Google Fonts) rely on upstream availability. All local assets (`assets/`, `fonts/`, `img/`, `.mp4` video files) are included in this backup.

---

## 6. Backup Contents & Exclusions Summary

- **Included**:
  - Full source code (`server.js`, `index.html`, `backstage.html`, `backstage-app.js`, `public-hydrator.js`, `client-bundle.js`, `SplashCursor.jsx`, `ThrineModel.jsx`, `api/`).
  - All local video files, images, 3D models, and fonts (`assets/`, `assets-bk/`, `fonts/`, `img/`, `*.mp4`).
  - Full CMS content manifests (`data/content.json`, `data/content-draft.json`, `data/content.backup.json`).
  - Complete `.git` repository and commit history.
  - Safe configuration template (`.env.example`).
  - Project documentation (`README.md`, `DEPLOYMENT.md`, `INSTRUCTIONS.md`, `BACKUP_AND_RECOVERY.md`).
- **Excluded**:
  - `node_modules/` (reproducible via `npm install`).
  - `.env` and `.env.local` (private secrets and credentials).
  - `data/auth.json` (runtime session and auth state).
  - `scratch/` (temporary test logs and intermediate artifacts).

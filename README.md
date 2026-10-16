# Hukam Kar (Powered by Momin Tahir)
### Multilingual HR Resume Screener, Auto-Translator & ATS Semantic Ranker

Enterprise-grade multilingual candidate screening portal that auto-translates resumes into standardized English, evaluates candidates against Job Descriptions using AI semantic analysis, generates tailored interview questions, and provides one-click native interview scheduling.

---

## 🌟 Key Features

1. **Multilingual Resume Auto-Ingestion**:
   - Ingests multiple resumes simultaneously (PDF, DOCX, XLSX/CSV, TXT).
   - Auto-detects source languages (Arabic, Spanish, French, German, Urdu, Chinese, Japanese, etc.).

2. **Full Structure & Layout Preservation to English**:
   - Translates into standardized English while preserving sections (Contact, Experience, Education, Skills).
   - Side-by-side Dual-Pane Comparison Viewer.
   - 1-Click Client-Side English PDF Export keeping original formatting.

3. **AI Cross-Lingual Semantic Matching**:
   - Scores candidates across Skills Alignment, Experience, Education, and Role Relevance.
   - Dynamic ATS leaderboards with Top Pick badges.
   - Identifies candidate strengths, gaps, and custom recruiter interview questions.

4. **1-Click Native Desktop Interview Scheduling**:
   - Directly launches native **Microsoft Outlook desktop application** with appointment details pre-filled.
   - Directly launches **Zoom desktop application** with generated meeting ID and passcode.
   - Persistent Scheduled Interviews & Calendar Alignment Bar.

---

## 🚀 How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the server
node server.js

# 3. Access in browser
http://localhost:3000
```

---

## 🌐 How to Deploy to the Cloud (24/7 Online Without Keeping Laptop On)

### Option 1: Render.com (100% Free & Recommended)
1. Push this project to your GitHub repository (or upload the `.zip`).
2. Log into [render.com](https://render.com).
3. Click **"New +"** -> **"Web Service"**.
4. Select your GitHub repository.
5. Render will automatically detect settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
6. Click **"Create Web Service"**.
7. In ~2 minutes, your portal will be live at `https://your-service-name.onrender.com` 24/7!

### Option 2: Railway.app / Koyeb
1. Connect your GitHub repository to [railway.app](https://railway.app) or [koyeb.com](https://koyeb.com).
2. It will automatically build and start the service.

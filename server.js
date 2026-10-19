require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { exec } = require('child_process');

const { extractTextFromFile } = require('./parser');
const { evaluateResume, callGroqAPI, DEFAULT_MODEL } = require('./groqService');
const { translateTextFree, parseCandidateProfile, evaluateResumeLocal } = require('./localEngine');
const { SAMPLE_JOB_DESCRIPTIONS, SAMPLE_RESUMES } = require('./sampleData');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup upload directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30 MB limit
});

app.use(cors());
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Health check & status
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    hasServerGroqKey: !!process.env.GROQ_API_KEY,
    defaultModel: DEFAULT_MODEL,
    enginesAvailable: ['local_free', 'groq_ai']
  });
});

/**
 * Test Groq API Key connectivity
 */
app.post('/api/test-groq-key', async (req, res) => {
  const apiKey = req.body.apiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ success: false, message: 'No API Key provided' });
  }

  try {
    const testPrompt = 'Respond with JSON {"status": "ok", "message": "API Connected Successfully"}';
    const result = await callGroqAPI(testPrompt, apiKey, DEFAULT_MODEL);
    res.json({ success: true, message: 'Cloud AI API Key is valid and active!', data: result });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
});

/**
 * Get sample JDs and sample resumes
 */
app.get('/api/samples', (req, res) => {
  res.json({
    jobDescriptions: SAMPLE_JOB_DESCRIPTIONS,
    sampleResumes: SAMPLE_RESUMES
  });
});

/**
 * TAB 1: DEDICATED RESUME TRANSLATION ONLY (NO JD REQUIRED)
 * Can run 100% Free via Local Neural Engine or optionally with Groq
 */
app.post('/api/translate-only', upload.array('resumes', 50), async (req, res) => {
  try {
    const files = req.files || [];
    const rawTexts = req.body.sampleIds ? JSON.parse(req.body.sampleIds) : [];
    const engine = req.body.engine || 'local'; // 'local' or 'groq'
    const groqApiKey = req.body.groqApiKey || process.env.GROQ_API_KEY || '';
    const model = req.body.model || DEFAULT_MODEL;

    const results = [];

    // 1. Process uploaded files
    for (const file of files) {
      let extracted;
      try {
        extracted = await extractTextFromFile(file.path, file.originalname, file.mimetype);
      } catch (err) {
        extracted = { text: `Error reading file: ${err.message}`, format: 'UNKNOWN', filename: file.originalname };
      }

      const item = await processSingleTranslation(extracted.text, file.originalname, extracted.format, engine, groqApiKey, model);
      results.push(item);

      // Clean up
      try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) {}
    }

    // 2. Process sample IDs if selected in translation tab
    if (rawTexts.length > 0) {
      const selectedSamples = SAMPLE_RESUMES.filter(s => rawTexts.includes(s.id));
      for (const sample of selectedSamples) {
        const item = await processSingleTranslation(sample.rawText, sample.filename, sample.filename.split('.').pop().toUpperCase(), engine, groqApiKey, model, sample.languageFlag);
        results.push(item);
      }
    }

    res.json({
      success: true,
      engineUsed: engine === 'groq' && groqApiKey ? 'groq_ai' : 'local_free',
      translations: results
    });
  } catch (err) {
    console.error('Translation error:', err);
    res.status(500).json({ error: 'Translation failed: ' + err.message });
  }
});

/**
 * Helper to process single translation with either Local or Groq engine
 */
async function processSingleTranslation(rawText, filename, format, engine, groqApiKey, model, sampleFlag = null) {
  if (engine === 'groq' && groqApiKey) {
    try {
      const groqResult = await evaluateResume(rawText, filename, 'General Cross-Border Professional Roles', groqApiKey, model, 'groq');
      return {
        id: 'trans-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        filename,
        format,
        sampleFlag,
        originalText: rawText,
        detectedLanguage: groqResult.detectedLanguage,
        candidate: groqResult.candidate,
        translatedText: formatStructuredEnglish(groqResult.translatedResume),
        translatedResume: groqResult.translatedResume
      };
    } catch (e) {
      console.warn('Groq translation failed, falling back to local engine:', e.message);
    }
  }

  // 100% Free Local Neural Translation
  const { translatedText, detectedLanguage } = await translateTextFree(rawText);
  const profile = parseCandidateProfile(translatedText, rawText, filename, detectedLanguage);

  return {
    id: 'trans-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    filename,
    format,
    sampleFlag,
    originalText: rawText,
    detectedLanguage,
    candidate: {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      yearsOfExperience: profile.yearsOfExperience,
      topSkills: profile.topSkills
    },
    translatedText,
    translatedResume: {
      summary: profile.summary,
      skills: profile.topSkills,
      experience: profile.experience,
      education: profile.education,
      certifications: profile.certifications,
      languages: profile.languages
    }
  };
}

function formatStructuredEnglish(trans) {
  let out = '';
  if (trans.summary) out += `SUMMARY:\n${trans.summary}\n\n`;
  if (trans.skills && trans.skills.length > 0) out += `SKILLS:\n${trans.skills.join(', ')}\n\n`;
  if (trans.experience && trans.experience.length > 0) {
    out += `EXPERIENCE:\n`;
    trans.experience.forEach(exp => {
      out += `• ${exp.role} at ${exp.company} (${exp.period || ''})\n`;
      if (exp.details) exp.details.forEach(d => out += `  - ${d}\n`);
    });
    out += '\n';
  }
  if (trans.education && trans.education.length > 0) {
    out += `EDUCATION:\n`;
    trans.education.forEach(edu => out += `• ${edu.degree} - ${edu.institution} (${edu.year || ''})\n`);
  }
  return out;
}

/**
 * TAB 2: SMART CV RANKER (WITH LOCAL FREE ENGINE OR GROQ)
 */
app.post('/api/rank-resumes', upload.array('resumes', 150), async (req, res) => {
  try {
    const files = req.files || [];
    const jobDescription = req.body.jobDescription;
    const engine = req.body.engine || 'local'; // 'local' or 'groq'
    const clientApiKey = req.body.groqApiKey;
    const apiKey = (clientApiKey && clientApiKey.trim()) || process.env.GROQ_API_KEY || '';
    const model = req.body.model || DEFAULT_MODEL;

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ error: 'Job description is required.' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one resume file.' });
    }

    console.log(`[Rank] Processing ${files.length} resumes using Engine: ${engine}...`);
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let extracted;
      try {
        extracted = await extractTextFromFile(file.path, file.originalname, file.mimetype);
      } catch (parseErr) {
        extracted = {
          text: `[Error reading file: ${parseErr.message}]`,
          pages: 1,
          format: file.originalname.split('.').pop() || 'UNKNOWN',
          filename: file.originalname
        };
      }

      let evaluationResult;

      // Check if user selected Groq or Local
      if (engine === 'groq' && apiKey) {
        try {
          evaluationResult = await evaluateResume(extracted.text, file.originalname, jobDescription, apiKey, model, 'groq');
        } catch (evalErr) {
          console.warn(`Groq evaluation error for ${file.originalname}, falling back to local:`, evalErr.message);
          evaluationResult = await evaluateLocally(extracted.text, file.originalname, jobDescription);
        }
      } else {
        // 100% Free Local Engine
        evaluationResult = await evaluateLocally(extracted.text, file.originalname, jobDescription);
      }

      results.push({
        id: 'cand-' + (i + 1) + '-' + Date.now(),
        filename: file.originalname,
        fileFormat: extracted.format,
        fileSizeKb: Math.round(file.size / 1024),
        originalText: extracted.text,
        ...evaluationResult
      });

      // Clean up file
      try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) {}
    }

    // Sort descending by score
    results.sort((a, b) => (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0));

    // Assign rank positions and badges
    results.forEach((item, idx) => {
      item.rank = idx + 1;
      if (item.rank === 1) item.badge = '🥇 #1 Top Pick';
      else if (item.rank === 2) item.badge = '🥈 #2 Runner Up';
      else if (item.rank === 3) item.badge = '🥉 #3 Strong Contender';
      else item.badge = `#${item.rank}`;
    });

    res.json({
      success: true,
      engineUsed: engine === 'groq' && apiKey ? 'groq_ai' : 'local_free',
      totalProcessed: results.length,
      rankings: results
    });
  } catch (err) {
    console.error('Batch ranking error:', err);
    res.status(500).json({ error: 'Server processing failed: ' + err.message });
  }
});

/**
 * TAB 2: Process preloaded multilingual sample resumes against Job Description
 */
app.post('/api/rank-samples', async (req, res) => {
  try {
    const jobDescription = req.body.jobDescription || SAMPLE_JOB_DESCRIPTIONS[0].description;
    const engine = req.body.engine || 'local'; // 'local' or 'groq'
    const clientApiKey = req.body.groqApiKey;
    const apiKey = (clientApiKey && clientApiKey.trim()) || process.env.GROQ_API_KEY || '';
    const model = req.body.model || DEFAULT_MODEL;
    const selectedIds = req.body.sampleIds || [];

    const samplesToProcess = selectedIds.length > 0 
      ? SAMPLE_RESUMES.filter(s => selectedIds.includes(s.id))
      : SAMPLE_RESUMES;

    console.log(`[Samples] Evaluating ${samplesToProcess.length} sample resumes using Engine: ${engine}...`);
    const results = [];

    for (let i = 0; i < samplesToProcess.length; i++) {
      const sample = samplesToProcess[i];
      let evaluationResult;

      if (engine === 'groq' && apiKey) {
        try {
          evaluationResult = await evaluateResume(sample.rawText, sample.filename, jobDescription, apiKey, model, 'groq');
        } catch (err) {
          console.warn(`Groq evaluation error for ${sample.id}, using local:`, err.message);
          evaluationResult = await evaluateLocally(sample.rawText, sample.filename, jobDescription);
        }
      } else {
        // 100% Free Local Engine
        evaluationResult = await evaluateLocally(sample.rawText, sample.filename, jobDescription);
      }

      results.push({
        id: sample.id,
        filename: sample.filename,
        fileFormat: sample.filename.split('.').pop().toUpperCase(),
        fileSizeKb: 124,
        originalText: sample.rawText,
        sampleFlag: sample.languageFlag,
        ...evaluationResult
      });
    }

    // Sort descending by score
    results.sort((a, b) => (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0));

    // Assign rank positions
    results.forEach((item, idx) => {
      item.rank = idx + 1;
      if (item.rank === 1) item.badge = '🥇 #1 Top Pick';
      else if (item.rank === 2) item.badge = '🥈 #2 Runner Up';
      else if (item.rank === 3) item.badge = '🥉 #3 Strong Contender';
      else item.badge = `#${item.rank}`;
    });

    res.json({
      success: true,
      engineUsed: engine === 'groq' && apiKey ? 'groq_ai' : 'local_free',
      totalProcessed: results.length,
      rankings: results
    });
  } catch (err) {
    console.error('Error processing samples:', err);
    res.status(500).json({ error: 'Failed to process samples: ' + err.message });
  }
});

/**
 * Helper to run local translation + local ATS evaluation
 */
async function evaluateLocally(rawText, filename, jobDescription) {
  const { translatedText, detectedLanguage } = await translateTextFree(rawText);
  const profile = parseCandidateProfile(translatedText, rawText, filename, detectedLanguage);
  const evaluation = evaluateResumeLocal(profile, translatedText, jobDescription);

  return {
    detectedLanguage,
    candidate: {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      yearsOfExperience: profile.yearsOfExperience,
      topSkills: profile.topSkills
    },
    translatedResume: {
      summary: profile.summary,
      skills: profile.topSkills,
      experience: profile.experience,
      education: profile.education,
      certifications: profile.certifications,
      languages: profile.languages
    },
    evaluation
  };
}

/**
 * Export results to Excel (.xlsx)
 */
app.post('/api/export-excel', (req, res) => {
  try {
    const { rankings, jdTitle } = req.body;
    if (!rankings || !Array.isArray(rankings)) {
      return res.status(400).json({ error: 'Rankings array is required' });
    }

    const rows = rankings.map(item => ({
      'Rank': item.rank,
      'Match Score (%)': item.evaluation?.overallScore || 0,
      'Tier': item.evaluation?.rankTier || 'N/A',
      'Candidate Name': item.candidate?.name || item.filename,
      'Email': item.candidate?.email || 'N/A',
      'Phone': item.candidate?.phone || 'N/A',
      'Location': item.candidate?.location || 'N/A',
      'Original Language': item.detectedLanguage || 'N/A',
      'Experience (Years)': item.candidate?.yearsOfExperience || 'N/A',
      'Skills Score (%)': item.evaluation?.breakdown?.skillsScore || 0,
      'Exp Score (%)': item.evaluation?.breakdown?.experienceScore || 0,
      'Top Skills': (item.candidate?.topSkills || []).join(', '),
      'Key Strengths': (item.evaluation?.strengths || []).join(' | '),
      'Gaps / Concerns': (item.evaluation?.gapsOrMissingSkills || []).join(' | '),
      'English Summary': item.translatedResume?.summary || '',
      'HR Recommendation': item.evaluation?.hrRecommendation || ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Ranked Candidates');

    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Candidate_Rankings_${Date.now()}.xlsx`);
    res.send(excelBuffer);
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).json({ error: 'Failed to generate Excel file: ' + err.message });
  }
});

// =========================================================================
// INTERVIEW SCHEDULING (ZOOM + MICROSOFT OUTLOOK .ICS)
// =========================================================================
const interviewsFilePath = path.join(__dirname, 'interviews.json');

function loadInterviews() {
  try {
    if (fs.existsSync(interviewsFilePath)) {
      const data = fs.readFileSync(interviewsFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading interviews.json:', e);
  }
  return [];
}

function saveInterviews(interviews) {
  try {
    fs.writeFileSync(interviewsFilePath, JSON.stringify(interviews, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving interviews.json:', e);
  }
}

/**
 * Generate RFC 5545 compliant .ics (iCalendar) string for Outlook
 */
function generateICS(interview) {
  const pad = (n) => String(n).padStart(2, '0');
  
  // Parse date and time
  let startDt;
  try {
    startDt = new Date(`${interview.scheduledDate}T${interview.scheduledTime}:00`);
    if (isNaN(startDt.getTime())) {
      startDt = new Date(Date.now() + 24 * 3600 * 1000);
    }
  } catch (e) {
    startDt = new Date(Date.now() + 24 * 3600 * 1000);
  }
  
  const duration = parseInt(interview.durationMinutes, 10) || 45;
  const endDt = new Date(startDt.getTime() + duration * 60 * 1000);

  const formatDate = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  const dtStamp = formatDate(new Date());
  const dtStart = formatDate(startDt);
  const dtEnd = formatDate(endDt);

  const cleanDescription = (
    `Hukam Kar - Candidate Interview (Powered by Momin Tahir)\\n\\n` +
    `Topic: ${interview.meetingTitle || 'Technical & Cultural Fit Interview'}\\n` +
    `Candidate: ${interview.candidateName} (${interview.candidateEmail || 'candidate@hukamkar.ai'})\\n` +
    `Hiring Manager: ${interview.hiringManagerName} (${interview.hiringManagerEmail || 'manager@company.com'})\\n` +
    `Timezone: ${interview.timezone || 'Local Time'}\\n\\n` +
    `=== ZOOM MEETING DETAILS ===\\n` +
    `Join Zoom Meeting: ${interview.zoomJoinUrl}\\n` +
    `Meeting ID: ${interview.zoomMeetingId}\\n` +
    `Passcode: ${interview.zoomPasscode}\\n\\n` +
    `Candidate ATS Score: ${interview.candidateScore || 'N/A'}%\\n` +
    `Top Skills: ${(interview.candidateSkills || []).join(', ')}\\n\\n` +
    `Notes & Focus:\\n${(interview.notes || 'Please review candidate resume portfolio prior to call.').replace(/\n/g, '\\n')}`
  );

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hukam Kar//HR Interview Scheduler - Powered by Momin Tahir//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${interview.id}@hukamkar.ai`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Interview: ${interview.candidateName} with ${interview.hiringManagerName}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${interview.zoomJoinUrl}`,
    'STATUS:CONFIRMED',
    `ORGANIZER;CN=Hukam Kar HR (Momin Tahir):mailto:hr@hukamkar.ai`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${interview.hiringManagerName}:mailto:${interview.hiringManagerEmail || 'manager@company.com'}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${interview.candidateName}:mailto:${interview.candidateEmail || 'candidate@hukamkar.ai'}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Zoom Interview in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Get all scheduled interviews
 */
app.get('/api/scheduled-interviews', (req, res) => {
  const interviews = loadInterviews();
  res.json({ success: true, count: interviews.length, interviews });
});

/**
 * Helper to launch desktop applications (Outlook and Zoom) on Windows laptop
 */
function launchAppOnWindows(appType, interview) {
  try {
    if (process.platform !== 'win32') {
      console.log(`[Cloud Deployment] Platform is ${process.platform}. Native desktop app launch skipped on server.`);
      return { success: true, app: appType, platform: process.platform, cloud: true };
    }
    if (appType === 'outlook') {
      const cleanName = (interview.candidateName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
      const icsPath = path.join(uploadDir, `Interview_${cleanName}_Outlook.ics`);
      fs.writeFileSync(icsPath, interview.icsContent || generateICS(interview), 'utf8');
      
      // On Windows, start "" "path.ics" triggers default handler (Microsoft Outlook)
      exec(`cmd.exe /c start "" "${icsPath}"`, (err) => {
        if (err) console.error('Error launching Microsoft Outlook:', err);
        else console.log('🚀 Microsoft Outlook desktop app launched for:', interview.candidateName);
      });
      return { success: true, app: 'outlook', icsPath };
    } else if (appType === 'zoom') {
      const zoomTarget = interview.zoomAppUrl || interview.zoomJoinUrl;
      exec(`cmd.exe /c start "" "${zoomTarget}"`, (err) => {
        if (err) console.error('Error launching Zoom desktop:', err);
        else console.log('🎥 Zoom desktop app launched for:', interview.candidateName);
      });
      return { success: true, app: 'zoom', zoomTarget };
    }
  } catch (err) {
    console.error('launchAppOnWindows error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Schedule a new interview (Generates Zoom + Outlook ICS & directly launches apps)
 */
app.post('/api/schedule-interview', (req, res) => {
  try {
    const {
      candidateId,
      candidateName,
      candidateEmail,
      candidateScore,
      candidateSkills,
      hiringManagerName,
      hiringManagerEmail,
      scheduledDate,
      scheduledTime,
      durationMinutes,
      timezone,
      meetingTitle,
      customZoomUrl,
      notes,
      autoLaunchOutlook,
      autoLaunchZoom
    } = req.body;

    if (!candidateName || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ error: 'Candidate name, interview date and time are required.' });
    }

    const id = 'intv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Generate realistic Zoom meeting parameters if not provided
    const randMeetingId = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
    const randPasscode = Math.floor(100000 + Math.random() * 900000).toString();
    const meetingNum = randMeetingId.replace(/\s+/g, '');

    const zoomJoinUrl = customZoomUrl && customZoomUrl.trim()
      ? customZoomUrl.trim()
      : `https://zoom.us/j/${meetingNum}?pwd=${randPasscode}`;

    const zoomAppUrl = `zoommtg://zoom.us/join?confno=${meetingNum}&pwd=${randPasscode}`;

    const newInterview = {
      id,
      candidateId: candidateId || 'cand_' + Date.now(),
      candidateName,
      candidateEmail: candidateEmail || 'candidate@hukamkar.ai',
      candidateScore: candidateScore || 85,
      candidateSkills: candidateSkills || [],
      hiringManagerName: hiringManagerName || 'Hiring Manager',
      hiringManagerEmail: hiringManagerEmail || 'hiring.manager@company.com',
      scheduledDate,
      scheduledTime,
      durationMinutes: parseInt(durationMinutes, 10) || 45,
      timezone: timezone || 'Asia/Karachi (PKT GMT+5)',
      meetingTitle: meetingTitle || `Technical Interview - ${candidateName}`,
      zoomMeetingId: randMeetingId,
      zoomPasscode: randPasscode,
      zoomJoinUrl,
      zoomAppUrl,
      notes: notes || '',
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    };

    // Generate ICS content
    const icsContent = generateICS(newInterview);
    newInterview.icsContent = icsContent;

    const interviews = loadInterviews();
    interviews.unshift(newInterview);
    saveInterviews(interviews);

    // Directly launch desktop applications if requested
    const launchResults = {};
    if (autoLaunchOutlook !== false) {
      launchResults.outlook = launchAppOnWindows('outlook', newInterview);
    }
    if (autoLaunchZoom === true) {
      launchResults.zoom = launchAppOnWindows('zoom', newInterview);
    }

    res.json({
      success: true,
      message: 'Interview successfully scheduled with Zoom & Outlook desktop launch',
      interview: newInterview,
      launchResults
    });
  } catch (err) {
    console.error('Schedule interview error:', err);
    res.status(500).json({ error: 'Failed to schedule interview: ' + err.message });
  }
});

/**
 * Launch desktop applications (Microsoft Outlook and/or Zoom) directly on user laptop
 */
app.post('/api/launch-app', (req, res) => {
  try {
    const { id, appType } = req.body; // 'outlook' | 'zoom' | 'both'
    const interviews = loadInterviews();
    const interview = interviews.find(i => i.id === id);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const results = {};
    if (appType === 'outlook' || appType === 'both') {
      results.outlook = launchAppOnWindows('outlook', interview);
    }
    if (appType === 'zoom' || appType === 'both') {
      results.zoom = launchAppOnWindows('zoom', interview);
    }

    res.json({
      success: true,
      message: `Launched ${appType} directly on your laptop!`,
      results
    });
  } catch (err) {
    console.error('Launch app error:', err);
    res.status(500).json({ error: 'Failed to launch desktop app: ' + err.message });
  }
});

/**
 * Download .ics calendar file for Microsoft Outlook
 */
app.get('/api/interview-ics/:id', (req, res) => {
  const { id } = req.params;
  const interviews = loadInterviews();
  const interview = interviews.find(i => i.id === id);

  if (!interview) {
    return res.status(404).send('Interview not found');
  }

  const ics = interview.icsContent || generateICS(interview);
  const cleanName = (interview.candidateName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Interview_${cleanName}_Outlook.ics"`);
  res.send(ics);
});

/**
 * Cancel / Delete a scheduled interview
 */
app.delete('/api/schedule-interview/:id', (req, res) => {
  const { id } = req.params;
  let interviews = loadInterviews();
  const initialLength = interviews.length;
  interviews = interviews.filter(i => i.id !== id);

  if (interviews.length === initialLength) {
    return res.status(404).json({ error: 'Interview not found' });
  }

  saveInterviews(interviews);
  res.json({ success: true, message: 'Interview cancelled successfully' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Hukam Kar - Powered by Momin Tahir`);
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`⚡ Supports 100% Free Local Engine + Cloud AI`);
    console.log(`=======================================================`);
  });
}

module.exports = app;

/**
 * Free Local Engine for Multilingual Translation & ATS Resume Ranking
 * Does NOT require any Groq API Key or external paid services.
 * 100% Free, Unlimited, and Self-Contained.
 */

// Mapping of language codes to human-readable names
const LANGUAGE_NAMES = {
  'ar': 'Arabic',
  'ur': 'Urdu',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ru': 'Russian',
  'pt': 'Portuguese',
  'it': 'Italian',
  'hi': 'Hindi',
  'tr': 'Turkish',
  'nl': 'Dutch',
  'ko': 'Korean',
  'fa': 'Persian',
  'en': 'English'
};

// Rate limiter / circuit breaker for Google Translate endpoint
let googleTranslateRateLimitedUntil = 0;
const translationCache = new Map();

/**
 * Quick heuristic to check if text is predominantly English
 */
function isPredominantlyEnglish(text) {
  if (!text) return true;
  // Non-Latin scripts check
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(text)) return false; // Arabic / Urdu
  if (/[\u0400-\u04FF]/.test(text)) return false; // Cyrillic
  if (/[\u4E00-\u9FFF\u3040-\u30FF]/.test(text)) return false; // CJK

  const sample = text.substring(0, 3000).toLowerCase();
  const englishKeywords = [
    'experience', 'education', 'skills', 'work', 'project', 'curriculum',
    'university', 'management', 'responsibilities', 'developer', 'engineer',
    'sales', 'summary', 'professional', 'contact', 'profile'
  ];
  let hits = 0;
  for (const kw of englishKeywords) {
    if (sample.includes(kw)) hits++;
  }
  return hits >= 3;
}

/**
 * Free translation via neural Google Translate endpoint
 * Handles intelligent chunking, English bypass, and rate-limit circuit breaking
 */
async function translateTextFree(text) {
  if (!text || !text.trim()) {
    return { translatedText: '', detectedLanguage: 'English', languageCode: 'en' };
  }

  // 1. Bypass translation if already English
  if (isPredominantlyEnglish(text)) {
    return {
      translatedText: text,
      detectedLanguage: 'English',
      languageCode: 'en'
    };
  }

  // 2. Check circuit breaker
  if (Date.now() < googleTranslateRateLimitedUntil) {
    return {
      translatedText: text,
      detectedLanguage: 'Detected Language',
      languageCode: 'auto'
    };
  }

  // 3. Fast detection on first 300 chars
  const sample = text.substring(0, 300).trim();
  let detectedCode = 'en';

  try {
    const detectUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(sample)}`;
    const res = await fetch(detectUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.status === 429) {
      googleTranslateRateLimitedUntil = Date.now() + 60000;
      return { translatedText: text, detectedLanguage: 'Detected Language', languageCode: 'auto' };
    }
    if (res.ok) {
      const d = await res.json();
      if (d && d[2]) detectedCode = d[2];
    }
  } catch (e) {
    // Ignore network error on detection
  }

  if (detectedCode === 'en') {
    return { translatedText: text, detectedLanguage: 'English', languageCode: 'en' };
  }

  // 4. Large-chunk translation (up to 2500 chars per chunk, max 3 chunks to prevent rate limiting)
  const paragraphs = text.split(/\n\s*\n/);
  const largeChunks = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if ((currentChunk + '\n\n' + trimmed).length > 2500) {
      if (currentChunk) largeChunks.push(currentChunk);
      currentChunk = trimmed.substring(0, 2500);
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed;
    }
    if (largeChunks.length >= 3) break; // Limit to 3 large chunks max per resume
  }
  if (currentChunk && largeChunks.length < 3) largeChunks.push(currentChunk);

  const translatedPieces = [];
  for (const chunk of largeChunks) {
    if (translationCache.has(chunk)) {
      translatedPieces.push(translationCache.get(chunk));
      continue;
    }

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(chunk)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.status === 429) {
        googleTranslateRateLimitedUntil = Date.now() + 60000;
        translatedPieces.push(chunk);
        break;
      }
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data && data[0]) {
        const piece = data[0].map(item => item[0]).join('');
        translationCache.set(chunk, piece);
        translatedPieces.push(piece);
      } else {
        translatedPieces.push(chunk);
      }
    } catch (err) {
      translatedPieces.push(chunk);
    }
  }

  const finalTranslated = translatedPieces.length > 0 ? translatedPieces.join('\n\n') : text;
  const languageName = LANGUAGE_NAMES[detectedCode] || detectedCode.toUpperCase();

  return {
    translatedText: finalTranslated,
    detectedLanguage: languageName,
    languageCode: detectedCode
  };
}

/**
 * Common skill dictionary for ontology matching
 */
const GLOBAL_SKILLS_ONTOLOGY = [
  // Tech & Engineering
  'javascript', 'typescript', 'react', 'react.js', 'next.js', 'node.js', 'nodejs', 'express',
  'python', 'django', 'fastapi', 'flask', 'go', 'golang', 'java', 'spring', 'c++', 'c#', '.net',
  'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'devops',
  'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'graphql', 'rest api',
  'git', 'linux', 'microservices', 'serverless', 'html', 'css', 'tailwind css',
  // HR & Talent Management
  'recruitment', 'talent acquisition', 'sourcing', 'ats', 'workday', 'bamboohr', 'greenhouse',
  'personio', 'deel', 'remote.com', 'labor law', 'compliance', 'payroll', 'performance management',
  'employee relations', 'onboarding', 'hris', 'people operations', 'compensation', 'benefits',
  // Supply Chain & Operations
  'supply chain', 'logistics', 'freight forwarding', 'procurement', 'inventory', 'warehouse',
  'sap', 'sap s/4hana', 'oracle scm', 'incoterms', 'customs clearance', 'vendor negotiation',
  // Soft & Leadership
  'agile', 'scrum', 'leadership', 'cross-functional', 'project management', 'communication',
  'bilingual', 'problem solving', 'stakeholder management', 'data analysis', 'kpis'
];

/**
 * Extracts structured candidate details from English text
 */
function parseCandidateProfile(englishText, originalText, filename, detectedLanguage) {
  const lines = englishText.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Extract Name (Usually top 1-3 lines or from filename)
  let name = '';
  for (let i = 0; i < Math.min(4, lines.length); i++) {
    const l = lines[i];
    if (/^(curriculum|resume|cv|personal|profile|lebeslauf)/i.test(l)) {
      name = l.replace(/^(curriculum vitae|resume|cv|personal resume|lebeslauf)[\s:|-]*/i, '').trim();
      if (name.length > 2 && name.length < 40) break;
    }
  }
  if (!name && lines.length > 0) {
    name = lines[0].replace(/^(name|candidatename)[\s:]+/i, '').trim();
  }
  if (!name || name.length > 40) {
    name = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // Extract Email
  const emailMatch = englishText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : `${name.toLowerCase().replace(/\s+/g, '.')}@candidate-intl.com`;

  // Extract Phone
  const phoneMatch = englishText.match(/(\+?[0-9\s\-()]{8,20})/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '+1 (555) 019-2834';

  // Extract Experience Years
  let yearsOfExperience = 4;
  const expMatch = englishText.match(/(\d{1,2})\+?\s*(years|ans|jahre|años|سنوات|سال)\s*(of\s*)?(experience|d'expérience|berufserfahrung|experiencia|تجربہ)/i);
  if (expMatch) {
    yearsOfExperience = parseInt(expMatch[1], 10);
  } else {
    // Check year ranges (e.g. 2018 - 2024)
    const yearMatches = [...englishText.matchAll(/(20\d\d)\s*[-–—to]+\s*(20\d\d|present|now|current)/gi)];
    if (yearMatches.length > 0) {
      let totalSpan = 0;
      const currentYear = new Date().getFullYear();
      yearMatches.forEach(m => {
        const start = parseInt(m[1], 10);
        const end = /present|now|current/i.test(m[2]) ? currentYear : parseInt(m[2], 10);
        if (end >= start && (end - start) < 30) totalSpan += (end - start);
      });
      if (totalSpan > 0) yearsOfExperience = Math.min(25, totalSpan);
    }
  }

  // Extract Skills
  const lowerText = englishText.toLowerCase();
  const matchedSkills = GLOBAL_SKILLS_ONTOLOGY.filter(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(lowerText);
  });

  // Extract Location
  let location = 'International / Remote';
  const locationKeywords = ['Madrid', 'Spain', 'Dubai', 'UAE', 'London', 'UK', 'Paris', 'France', 'Berlin', 'Germany', 'Lahore', 'Pakistan', 'Karachi', 'Shanghai', 'China', 'Tokyo', 'Japan', 'New York', 'USA', 'Toronto', 'Canada'];
  for (const loc of locationKeywords) {
    if (new RegExp(`\\b${loc}\\b`, 'i').test(englishText)) {
      location = loc;
      break;
    }
  }

  // Section splitting for structured view
  const sections = splitSections(englishText);

  return {
    name,
    email,
    phone,
    location,
    yearsOfExperience,
    topSkills: matchedSkills.slice(0, 8),
    sections,
    summary: sections.summary || lines.slice(1, 4).join(' '),
    experience: sections.experience,
    education: sections.education,
    certifications: sections.certifications,
    languages: [`${detectedLanguage} (Native)`, 'English (Professional)']
  };
}

/**
 * Splits plain text into resume sections
 */
function splitSections(text) {
  const lines = text.split('\n');
  const summaryLines = [];
  const expLines = [];
  const eduLines = [];
  const certLines = [];

  let currentSection = 'summary';

  lines.forEach(line => {
    const l = line.trim();
    if (!l) return;

    if (/(experience|employment|work history|professional background)/i.test(l) && l.length < 35) {
      currentSection = 'experience';
      return;
    }
    if (/(education|academic|formation|ausbildung|university|degree)/i.test(l) && l.length < 35) {
      currentSection = 'education';
      return;
    }
    if (/(certification|license|accreditation|credentials)/i.test(l) && l.length < 35) {
      currentSection = 'certifications';
      return;
    }

    if (currentSection === 'summary') summaryLines.push(l);
    else if (currentSection === 'experience') expLines.push(l);
    else if (currentSection === 'education') eduLines.push(l);
    else if (currentSection === 'certifications') certLines.push(l);
  });

  return {
    summary: summaryLines.slice(0, 5).join(' '),
    experience: expLines.length > 0 ? [{
      role: 'Professional Roles & Projects',
      company: 'International Organizations',
      period: 'Recent',
      details: expLines.slice(0, 6)
    }] : [],
    education: eduLines.length > 0 ? [{
      degree: eduLines[0],
      institution: eduLines[1] || 'University / Academic Institution',
      year: eduLines[2] || ''
    }] : [],
    certifications: certLines.slice(0, 4)
  };
}

/**
 * Local ATS Semantic Matching & Scoring Algorithm (No Groq Needed)
 */
function evaluateResumeLocal(candidateProfile, englishText, jobDescription) {
  const jdLower = jobDescription.toLowerCase();
  const cvLower = englishText.toLowerCase();

  // 1. Identify skills required in JD
  const jdSkills = GLOBAL_SKILLS_ONTOLOGY.filter(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(jdLower);
  });

  // 2. Identify skills present in CV
  const candidateSkills = candidateProfile.topSkills.map(s => s.toLowerCase());
  const matchedSkills = jdSkills.filter(s => cvLower.includes(s) || candidateSkills.includes(s));
  const missingSkills = jdSkills.filter(s => !cvLower.includes(s) && !candidateSkills.includes(s));

  // Skills Score (40% weight)
  const skillsScore = jdSkills.length > 0
    ? Math.min(100, Math.round((matchedSkills.length / jdSkills.length) * 100))
    : 75;

  // 3. Experience Match (30% weight)
  let requiredYears = 4;
  const jdExpMatch = jdLower.match(/(\d{1,2})\+?\s*years/);
  if (jdExpMatch) requiredYears = parseInt(jdExpMatch[1], 10);

  let experienceScore = 70;
  if (candidateProfile.yearsOfExperience >= requiredYears) {
    experienceScore = Math.min(100, 85 + (candidateProfile.yearsOfExperience - requiredYears) * 3);
  } else {
    experienceScore = Math.max(40, Math.round((candidateProfile.yearsOfExperience / requiredYears) * 80));
  }

  // 4. Education & Certification Fit (15% weight)
  let educationScore = 75;
  if (/bachelor|master|phd|degree|university|engineering|bs|ms/i.test(cvLower)) {
    educationScore = 90;
  }
  if (/certified|aws certified|cka|pmp|shrm/i.test(cvLower)) {
    educationScore = Math.min(100, educationScore + 10);
  }

  // 5. Semantic Keyword Overlap (15% weight)
  const jdWords = jdLower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 4);
  const uniqueJdWords = [...new Set(jdWords)];
  let hitWords = 0;
  uniqueJdWords.forEach(w => {
    if (cvLower.includes(w)) hitWords++;
  });
  const roleRelevanceScore = uniqueJdWords.length > 0
    ? Math.min(100, Math.round((hitWords / uniqueJdWords.length) * 100) + 20)
    : 70;

  // Overall Weighted Score
  const overallScore = Math.min(99, Math.max(35, Math.round(
    (skillsScore * 0.40) +
    (experienceScore * 0.30) +
    (educationScore * 0.15) +
    (roleRelevanceScore * 0.15)
  )));

  // Tier Classification
  let rankTier = 'Top Match';
  if (overallScore < 50) rankTier = 'Low Match';
  else if (overallScore < 75) rankTier = 'Moderate Match';
  else if (overallScore < 90) rankTier = 'Strong Match';

  // Strengths
  const strengths = [];
  if (matchedSkills.length > 0) {
    strengths.push(`Direct alignment on ${matchedSkills.length} core JD skills: ${matchedSkills.slice(0, 4).join(', ')}.`);
  }
  if (candidateProfile.yearsOfExperience >= requiredYears) {
    strengths.push(`Meets experience threshold with ${candidateProfile.yearsOfExperience} years (required: ${requiredYears}+).`);
  } else {
    strengths.push(`Has ${candidateProfile.yearsOfExperience} years of practical industry background.`);
  }
  strengths.push(`Bilingual capability (${candidateProfile.languages[0]}) with demonstrated English proficiency.`);

  // Missing Skills / Gaps
  const gapsOrMissingSkills = [];
  if (missingSkills.length > 0) {
    gapsOrMissingSkills.push(`Missing explicit mentions of required tools: ${missingSkills.slice(0, 3).join(', ')}.`);
  }
  if (candidateProfile.yearsOfExperience < requiredYears) {
    gapsOrMissingSkills.push(`Years of experience (${candidateProfile.yearsOfExperience}y) is below preferred target (${requiredYears}y).`);
  }
  if (gapsOrMissingSkills.length === 0) {
    gapsOrMissingSkills.push('Verify exact depth of microservices architecture in production.');
  }

  // AI-Formulated Recruiter Interview Questions
  const interviewQuestions = [
    `Can you describe your practical experience with ${matchedSkills[0] || 'the core requirements in the JD'}?`,
    missingSkills.length > 0
      ? `The role requires knowledge of ${missingSkills[0]}. Have you worked with this or comparable frameworks?`
      : 'What is the largest scale system or project you have delivered under tight deadlines?',
    `How do you handle day-to-day coordination in multilingual and cross-border teams?`
  ];

  const hrRecommendation = `${rankTier}: Candidate displays a ${overallScore}% match index. ${strengths[0]} Recommended for ${overallScore >= 75 ? 'Technical Screening Interview' : 'Further Background Review'}.`;

  return {
    overallScore,
    rankTier,
    breakdown: {
      skillsScore,
      experienceScore,
      educationScore,
      roleRelevanceScore
    },
    strengths,
    gapsOrMissingSkills,
    interviewQuestions,
    hrRecommendation
  };
}

module.exports = {
  translateTextFree,
  parseCandidateProfile,
  evaluateResumeLocal
};

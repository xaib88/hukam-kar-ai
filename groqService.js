/**
 * Groq AI Service for Multilingual Resume Translation & Semantic Job Matching
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

/**
 * Call Groq API with robust retry, fallback models, and JSON extraction
 */
async function callGroqAPI(prompt, apiKey, requestedModel = DEFAULT_MODEL) {
  if (!apiKey) {
    throw new Error('GROQ_API_KEY_REQUIRED');
  }

  const modelsToTry = [requestedModel, ...FALLBACK_MODELS.filter(m => m !== requestedModel)];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const isJsonFormatSupported = !model.includes('qwen');
      const bodyPayload = {
        model,
        messages: [
          {
            role: 'system',
            content: `You are an elite Enterprise Talent Intelligence & Multilingual HR Screener AI (similar to Eightfold AI & Textkernel).
Your task is to take resumes in ANY international language (Spanish, Arabic, French, German, Urdu, Hindi, Chinese, Japanese, Russian, etc.), detect the language, translate the entire resume into professional English preserving layout and formatting, and evaluate the candidate deeply against a given Job Description.
Always output pure valid JSON without markdown wrapping or code fences.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1
      };

      if (isJsonFormatSupported) {
        bodyPayload.response_format = { type: 'json_object' };
      }

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 404 && errorText.includes('model_not_found')) {
          console.warn(`Model ${model} not available on Groq, trying next fallback...`);
          lastError = new Error(`Groq Model Error: ${errorText}`);
          continue; // Try next model
        }
        throw new Error(`Groq API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || '{}';

      try {
        return JSON.parse(rawContent);
      } catch (e) {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error(`Failed to parse AI JSON response: ${rawContent.substring(0, 100)}...`);
      }
    } catch (err) {
      lastError = err;
      if (err.message.includes('model_not_found')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All Groq model attempts failed.');
}

/**
 * Translates and Evaluates a single Resume against a Job Description
 */
async function evaluateResume(resumeText, filename, jobDescription, apiKey, model = DEFAULT_MODEL) {
  if (!apiKey || apiKey === 'DEMO_MODE') {
    return simulateEvaluation(resumeText, filename, jobDescription);
  }

  const prompt = `
Please process the following resume against the target Job Description.

TARGET JOB DESCRIPTION:
"""
${jobDescription.trim()}
"""

CANDIDATE RESUME RAW TEXT (Filename: ${filename}):
"""
${resumeText.substring(0, 12000)}
"""

REQUIREMENTS:
1. DETECT ORIGINAL LANGUAGE: e.g. "Spanish", "Arabic", "Urdu", "French", "German", "English", etc.
2. TRANSLATION TO ENGLISH:
   Translate the resume fully into standard professional English while keeping the exact sections:
   - Candidate Name
   - Contact Info (Email, Phone, Location/Country)
   - Professional Title & Summary
   - Total Years of Experience (estimated number)
   - Core Skills (array of strings)
   - Work Experience History (Chronological timeline)
   - Education & Degrees
   - Certifications & Licenses
   - Spoken / Written Languages
3. SEMANTIC MATCHING & SCORING AGAINST JOB DESCRIPTION:
   - score: Overall match percentage (0 to 100)
   - rankTier: One of "Top Match" (90-100), "Strong Match" (75-89), "Moderate Match" (50-74), "Low Match" (<50)
   - breakdown:
     - skillsScore: 0 to 100
     - experienceScore: 0 to 100
     - educationScore: 0 to 100
     - roleRelevanceScore: 0 to 100
   - strengths: Array of 3 to 5 clear bullet points explaining why this candidate is a strong fit.
   - gapsOrMissingSkills: Array of 2 to 4 bullet points explaining missing requirements, missing tools, or experience gaps.
   - interviewQuestions: Array of 3 to 4 tailored, incisive interview questions for the HR recruiter to probe gaps or verify achievements.
   - hrRecommendation: A 2-sentence executive summary verdict for the hiring manager.

Return ONLY a JSON object with this exact schema:
{
  "detectedLanguage": "Arabic",
  "candidate": {
    "name": "Full Name",
    "email": "candidate@email.com",
    "phone": "+123...",
    "location": "City, Country",
    "yearsOfExperience": 7,
    "topSkills": ["Skill 1", "Skill 2", "Skill 3"]
  },
  "translatedResume": {
    "summary": "English summary...",
    "skills": ["Skill A", "Skill B", "Skill C"],
    "experience": [
      {
        "role": "Job Title",
        "company": "Company Name",
        "period": "2021 - Present",
        "details": ["Achievement 1 in English", "Achievement 2 in English"]
      }
    ],
    "education": [
      {
        "degree": "Degree Name",
        "institution": "University / College",
        "year": "2018"
      }
    ],
    "certifications": ["Cert 1", "Cert 2"],
    "languages": ["Arabic (Native)", "English (Professional)"]
  },
  "evaluation": {
    "overallScore": 92,
    "rankTier": "Top Match",
    "breakdown": {
      "skillsScore": 95,
      "experienceScore": 90,
      "educationScore": 90,
      "roleRelevanceScore": 93
    },
    "strengths": [
      "Extensive background in required core stack...",
      "Proven leadership in distributed cross-border teams...",
      "Relevant cloud certifications matching JD"
    ],
    "gapsOrMissingSkills": [
      "Limited direct mention of specialized tools",
      "Notice period may be standard 2 months"
    ],
    "interviewQuestions": [
      "Can you describe your experience migrating legacy services to cloud-native microservices?",
      "How did you handle cross-timezone coordination in your previous multinational role?"
    ],
    "hrRecommendation": "Highly recommended for First Round Technical Screen. Exceeds primary criteria with strong bilingual communication potential."
  }
}
`;

  try {
    const result = await callGroqAPI(prompt, apiKey, model || DEFAULT_MODEL);
    return {
      filename,
      detectedLanguage: result.detectedLanguage || 'Detected Language',
      candidate: result.candidate || { name: filename.replace(/\.[^/.]+$/, ''), yearsOfExperience: 0, topSkills: [] },
      translatedResume: result.translatedResume || {},
      evaluation: result.evaluation || { overallScore: 50, rankTier: 'Moderate Match', strengths: [], gapsOrMissingSkills: [] }
    };
  } catch (err) {
    console.error(`Evaluation failed with Groq AI for ${filename}:`, err.message);
    throw err;
  }
}

/**
 * Intelligent simulation engine for fallback
 */
function simulateEvaluation(resumeText, filename, jobDescription) {
  const lowerText = resumeText.toLowerCase();
  let detectedLanguage = 'English';
  
  if (/[\u0600-\u06FF]/.test(resumeText)) {
    detectedLanguage = lowerText.includes('ہے') || lowerText.includes('میں') ? 'Urdu' : 'Arabic';
  } else if (/[áéíóúñ¿¡]/.test(resumeText) || lowerText.includes('experiencia') || lowerText.includes('habilidades')) {
    detectedLanguage = 'Spanish';
  } else if (/[éèêëàâôûùïç]/.test(resumeText) || lowerText.includes('expérience') || lowerText.includes('compétences')) {
    detectedLanguage = 'French';
  } else if (/[äöüß]/.test(resumeText) || lowerText.includes('berufserfahrung') || lowerText.includes('fähigkeiten')) {
    detectedLanguage = 'German';
  } else if (/[\u4e00-\u9fa5]/.test(resumeText)) {
    detectedLanguage = 'Chinese (Mandarin)';
  } else if (/[\u3040-\u309F\u30A0-\u30FF]/.test(resumeText)) {
    detectedLanguage = 'Japanese';
  }

  const jdKeywords = jobDescription
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  const uniqueJdKeywords = [...new Set(jdKeywords)];
  let matchHits = 0;
  uniqueJdKeywords.forEach(kw => {
    if (lowerText.includes(kw)) matchHits++;
  });

  const baseScore = Math.min(96, Math.max(52, Math.round(55 + (matchHits / Math.max(1, uniqueJdKeywords.length)) * 50) + (Math.floor(Math.random() * 10) - 5)));
  
  let rankTier = 'Top Match';
  if (baseScore < 50) rankTier = 'Low Match';
  else if (baseScore < 75) rankTier = 'Moderate Match';
  else if (baseScore < 90) rankTier = 'Strong Match';

  const cleanName = filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return {
    filename,
    detectedLanguage,
    candidate: {
      name: cleanName || 'Global Candidate',
      email: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@example-intl.com`,
      phone: '+44 20 7946 0991',
      location: detectedLanguage === 'Spanish' ? 'Madrid, Spain' :
                detectedLanguage === 'Arabic' ? 'Dubai, UAE' :
                detectedLanguage === 'French' ? 'Paris, France' :
                detectedLanguage === 'German' ? 'Berlin, Germany' :
                detectedLanguage === 'Urdu' ? 'Lahore, Pakistan' : 'Global / Remote',
      yearsOfExperience: Math.floor(Math.random() * 8) + 4,
      topSkills: ['Cross-functional Leadership', 'Agile Operations', 'Stakeholder Management', 'Domain Expertise', 'Bilingual Communication']
    },
    translatedResume: {
      summary: `[Translated from ${detectedLanguage} to English] Dynamic professional with extensive background in international operations, demonstrating a proven track record of driving scalable business outcomes and optimizing cross-border collaboration.`,
      skills: ['Strategic Planning', 'Process Optimization', 'Talent Lifecycle Management', 'Cloud Solutions', 'Risk Analysis'],
      experience: [
        {
          role: 'Senior Lead / Specialist',
          company: 'Multinational Enterprise Group',
          period: '2021 - Present',
          details: [
            'Spearheaded international workflows across 4 regional hubs, reducing turnaround time by 32%.',
            'Implemented automated tracking frameworks complying with local regulatory standards.'
          ]
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science / Business Administration',
          institution: 'International University',
          year: '2016'
        }
      ],
      certifications: ['Certified Professional (Global Standard)', 'Advanced Agile Practitioner'],
      languages: [`${detectedLanguage} (Native)`, 'English (Full Professional Working)']
    },
    evaluation: {
      overallScore: baseScore,
      rankTier,
      breakdown: {
        skillsScore: Math.min(98, baseScore + Math.floor(Math.random() * 6)),
        experienceScore: Math.min(95, baseScore + Math.floor(Math.random() * 4) - 2),
        educationScore: Math.min(94, baseScore + 2),
        roleRelevanceScore: baseScore
      },
      strengths: [
        `Direct relevant domain experience matching core requirements.`,
        `Native proficiency in ${detectedLanguage} paired with fluent English for international operations.`,
        'Demonstrated history of driving measurable process efficiency in cross-cultural teams.'
      ],
      gapsOrMissingSkills: [
        'Could require onboarding verification for niche proprietary tooling.',
        'Remote timezone alignment to be confirmed during initial HR screen.'
      ],
      interviewQuestions: [
        'How have you previously managed complex projects spanning multiple international offices?',
        'Can you walk us through a scenario where language or cultural differences impacted project delivery, and how you resolved it?'
      ],
      hrRecommendation: `${rankTier}: Well-rounded international candidate. Strong linguistic asset with substantial foundational skills aligned to the Job Description.`
    }
  };
}

module.exports = {
  evaluateResume,
  callGroqAPI,
  DEFAULT_MODEL,
  FALLBACK_MODELS
};

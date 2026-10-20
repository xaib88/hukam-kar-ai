/**
 * TalentGlobal AI - Complete Frontend Application Controller (Clean Light / White Theme)
 * Featuring 2 Primary Tabs:
 * 1. Resume Translation Studio (100% Free / No JD needed)
 * 2. Smart CV Ranker & ATS Screener (Free Local Engine or Groq AI)
 */

// Global Application State
const state = {
  currentTab: 'translate', // 'translate' | 'ranker'
  currentEngine: localStorage.getItem('talentglobal_engine') || 'local', // 'local' | 'groq'
  groqApiKey: localStorage.getItem('hukamkar_ai_key') || localStorage.getItem('talentglobal_groq_key') || '',
  groqModel: (localStorage.getItem('talentglobal_groq_model') && localStorage.getItem('talentglobal_groq_model') !== 'openai/gpt-oss-120b') ? localStorage.getItem('talentglobal_groq_model') : 'llama-3.3-70b-versatile',
  
  // Translation Tab State
  transFiles: [],
  transSamples: [],
  translatedResults: [],
  
  // Ranker Tab State
  rankFiles: [],
  rankSamples: [],
  rankings: [],
  selectedCandidate: null,
  selectedForComparison: new Set(),
  currentFilterTier: 'ALL',
  currentFilterLanguage: 'ALL',
  currentSort: 'score_desc',
  
  // Interview Scheduler State (Zoom + Outlook)
  scheduledInterviews: [],
  activeSchedulingCandidate: null,
  
  // Shared Presets
  sampleJDs: [],
  sampleResumes: []
};

// Safe JSON parser to gracefully handle HTML / 524 timeouts from Cloudflare
async function parseSafeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    if (res.status === 524 || text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error(`Connection timeout (${res.status || 524}). The server took longer than expected. Please try again with fewer resumes or use Standard Neural engine.`);
    }
    throw new Error(`Server returned HTTP ${res.status}: ${text.substring(0, 100)}`);
  }
}

// DOM References
const dom = {
  // Navigation & Engine Switcher
  mainTabTranslate: document.getElementById('mainTabTranslate'),
  mainTabRanker: document.getElementById('mainTabRanker'),
  sectionTranslateStudio: document.getElementById('sectionTranslateStudio'),
  sectionRankerStudio: document.getElementById('sectionRankerStudio'),
  engineBtnLocal: document.getElementById('engineBtnLocal'),
  engineBtnGroq: document.getElementById('engineBtnGroq'),
  activeEngineText: document.getElementById('activeEngineText'),
  activeEngineBadge: document.getElementById('activeEngineBadge'),
  
  // Settings Modal
  btnOpenSettings: document.getElementById('btnOpenSettings'),
  settingsModal: document.getElementById('settingsModal'),
  btnCloseSettings: document.getElementById('btnCloseSettings'),
  inputGroqApiKey: document.getElementById('inputGroqApiKey'),
  selectGroqModel: document.getElementById('selectGroqModel'),
  btnTestGroqKey: document.getElementById('btnTestGroqKey'),
  testKeyFeedback: document.getElementById('testKeyFeedback'),
  btnSaveSettings: document.getElementById('btnSaveSettings'),
  toggleKeyVisibility: document.getElementById('toggleKeyVisibility'),
  
  // TAB 1: TRANSLATION STUDIO
  dropZoneTrans: document.getElementById('dropZoneTrans'),
  fileInputTrans: document.getElementById('fileInputTrans'),
  btnLoadTranslationSamples: document.getElementById('btnLoadTranslationSamples'),
  transQueueContainer: document.getElementById('transQueueContainer'),
  transQueueCount: document.getElementById('transQueueCount'),
  btnClearTransQueue: document.getElementById('btnClearTransQueue'),
  btnStartTranslation: document.getElementById('btnStartTranslation'),
  transBtnText: document.getElementById('transBtnText'),
  transProgressCard: document.getElementById('transProgressCard'),
  transProgressText: document.getElementById('transProgressText'),
  transProgressPercent: document.getElementById('transProgressPercent'),
  transProgressBar: document.getElementById('transProgressBar'),
  transResultsSection: document.getElementById('transResultsSection'),
  transResultsCount: document.getElementById('transResultsCount'),
  transCardsContainer: document.getElementById('transCardsContainer'),
  
  // TAB 2: CV RANKER
  jobDescription: document.getElementById('jobDescription'),
  jdWordCount: document.getElementById('jdWordCount'),
  btnClearJd: document.getElementById('btnClearJd'),
  dropZoneRank: document.getElementById('dropZoneRank'),
  fileInputRank: document.getElementById('fileInputRank'),
  btnLoadRankerSamples: document.getElementById('btnLoadRankerSamples'),
  rankQueueContainer: document.getElementById('rankQueueContainer'),
  rankQueueCount: document.getElementById('rankQueueCount'),
  btnClearRankQueue: document.getElementById('btnClearRankQueue'),
  btnRankAnalyze: document.getElementById('btnRankAnalyze'),
  rankBtnText: document.getElementById('rankBtnText'),
  rankProgressCard: document.getElementById('rankProgressCard'),
  rankProgressText: document.getElementById('rankProgressText'),
  rankProgressPercent: document.getElementById('rankProgressPercent'),
  rankProgressBar: document.getElementById('rankProgressBar'),
  
  // Ranker Results
  rankResultsSection: document.getElementById('rankResultsSection'),
  statTotal: document.getElementById('statTotal'),
  statTopMatches: document.getElementById('statTopMatches'),
  statAvgScore: document.getElementById('statAvgScore'),
  statLanguages: document.getElementById('statLanguages'),
  filterTier: document.getElementById('filterTier'),
  filterLanguage: document.getElementById('filterLanguage'),
  sortBy: document.getElementById('sortBy'),
  btnCompareSelected: document.getElementById('btnCompareSelected'),
  compareSelectedCount: document.getElementById('compareSelectedCount'),
  btnExportExcel: document.getElementById('btnExportExcel'),
  candidatesGrid: document.getElementById('candidatesGrid'),
  
  // Detail Modal
  candidateDetailModal: document.getElementById('candidateDetailModal'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  modalBtnCloseBottom: document.getElementById('modalBtnCloseBottom'),
  modalBtnDownloadPdf: document.getElementById('modalBtnDownloadPdf'),
  modalRankBadge: document.getElementById('modalRankBadge'),
  modalCandidateName: document.getElementById('modalCandidateName'),
  modalSubInfo: document.getElementById('modalSubInfo'),
  modalCandidateId: document.getElementById('modalCandidateId'),
  modalBtnPrint: document.getElementById('modalBtnPrint'),
  tabBtnDualPane: document.getElementById('tabBtnDualPane'),
  tabBtnAtsReport: document.getElementById('tabBtnAtsReport'),
  viewDualPane: document.getElementById('viewDualPane'),
  viewAtsReport: document.getElementById('viewAtsReport'),
  modalOriginalLang: document.getElementById('modalOriginalLang'),
  modalFormatBadge: document.getElementById('modalFormatBadge'),
  modalOriginalContent: document.getElementById('modalOriginalContent'),
  modalEnglishContent: document.getElementById('modalEnglishContent'),
  btnCopyEnglish: document.getElementById('btnCopyEnglish'),
  modalSkillsScore: document.getElementById('modalSkillsScore'),
  modalExpScore: document.getElementById('modalExpScore'),
  modalEduScore: document.getElementById('modalEduScore'),
  modalRoleScore: document.getElementById('modalRoleScore'),
  modalHrRecommendation: document.getElementById('modalHrRecommendation'),
  modalStrengthsList: document.getElementById('modalStrengthsList'),
  modalGapsList: document.getElementById('modalGapsList'),
  modalQuestionsList: document.getElementById('modalQuestionsList'),
  
  // Compare Modal
  compareModal: document.getElementById('compareModal'),
  btnCloseCompare: document.getElementById('btnCloseCompare'),
  compareGrid: document.getElementById('compareGrid'),

  // Scheduled Interviews Pipeline & Calendar Bar
  interviewPipelineBar: document.getElementById('interviewPipelineBar'),
  interviewPipelineCount: document.getElementById('interviewPipelineCount'),
  scheduledInterviewsList: document.getElementById('scheduledInterviewsList'),
  emptyInterviewsNotice: document.getElementById('emptyInterviewsNotice'),
  btnOpenManualScheduler: document.getElementById('btnOpenManualScheduler'),

  // Interview Modal (Zoom + Outlook)
  interviewModal: document.getElementById('interviewModal'),
  btnCloseInterviewModal: document.getElementById('btnCloseInterviewModal'),
  btnCancelInterviewModal: document.getElementById('btnCancelInterviewModal'),
  btnConfirmScheduleInterview: document.getElementById('btnConfirmScheduleInterview'),
  schCandidateBadge: document.getElementById('schCandidateBadge'),
  schCandidateNameDisplay: document.getElementById('schCandidateNameDisplay'),
  schCandidateSubDisplay: document.getElementById('schCandidateSubDisplay'),
  schInterviewDate: document.getElementById('schInterviewDate'),
  schInterviewTime: document.getElementById('schInterviewTime'),
  schDuration: document.getElementById('schDuration'),
  schTimezone: document.getElementById('schTimezone'),
  schMeetingTitle: document.getElementById('schMeetingTitle'),
  schHiringManagerName: document.getElementById('schHiringManagerName'),
  schHiringManagerEmail: document.getElementById('schHiringManagerEmail'),
  schCandidateName: document.getElementById('schCandidateName'),
  schCandidateEmail: document.getElementById('schCandidateEmail'),
  btnRegenerateZoom: document.getElementById('btnRegenerateZoom'),
  schZoomIdDisplay: document.getElementById('schZoomIdDisplay'),
  schZoomPassDisplay: document.getElementById('schZoomPassDisplay'),
  schZoomUrlInput: document.getElementById('schZoomUrlInput'),
  schNotes: document.getElementById('schNotes'),
  chkLaunchOutlook: document.getElementById('chkLaunchOutlook'),
  chkLaunchZoom: document.getElementById('chkLaunchZoom'),
  chkDownloadIcs: document.getElementById('chkDownloadIcs'),
  toastContainer: document.getElementById('toastContainer')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initEngineUI();
  initSettings();
  initTabNavigation();
  initEventListeners();
  await loadServerSamples();
  checkReadyStates();
  await initInterviews();
});

// Setup Engine Selection (Local Free vs Groq)
function initEngineUI() {
  if (state.currentEngine === 'ollama') state.currentEngine = 'local';
  setEngine(state.currentEngine);
}

function setEngine(engine) {
  state.currentEngine = engine === 'groq' ? 'groq' : 'local';
  localStorage.setItem('talentglobal_engine', state.currentEngine);

  const activeCls = (color) => `px-3 py-1.5 rounded-lg font-semibold transition-all bg-${color}-600 text-white shadow-sm flex items-center gap-1.5`;
  const inactiveCls = 'px-3 py-1.5 rounded-lg font-semibold text-slate-600 hover:text-slate-900 transition-all flex items-center gap-1.5';

  if (dom.engineBtnLocal) dom.engineBtnLocal.className = (state.currentEngine === 'local') ? activeCls('emerald') : inactiveCls;
  if (dom.engineBtnGroq) dom.engineBtnGroq.className = (state.currentEngine === 'groq') ? activeCls('indigo') : inactiveCls;

  if (dom.activeEngineText && dom.activeEngineBadge) {
    if (state.currentEngine === 'groq') {
      dom.activeEngineText.textContent = 'Active Engine: Ultra-Fast Cloud AI (120B Model)';
      dom.activeEngineBadge.className = 'hidden sm:flex items-center gap-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full';
    } else {
      dom.activeEngineText.textContent = 'Active Engine: Standard Neural (Local / Free)';
      dom.activeEngineBadge.className = 'hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full';
    }
  }
}

// Setup Primary Tabs
function initTabNavigation() {
  if (dom.mainTabTranslate) dom.mainTabTranslate.addEventListener('click', () => switchTab('translate'));
  if (dom.mainTabRanker) dom.mainTabRanker.addEventListener('click', () => switchTab('ranker'));
}

function switchTab(tab) {
  state.currentTab = tab;
  
  const activeTabCls = 'py-4 border-b-2 border-blue-600 text-blue-600 flex items-center gap-2.5 transition-all';
  const inactiveTabCls = 'py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2.5 transition-all';
  
  if (dom.mainTabTranslate) dom.mainTabTranslate.className = (tab === 'translate') ? 'py-4 border-b-2 border-emerald-600 text-emerald-600 flex items-center gap-2.5 transition-all' : inactiveTabCls;
  if (dom.mainTabRanker) dom.mainTabRanker.className = (tab === 'ranker') ? activeTabCls : inactiveTabCls;

  if (dom.sectionTranslateStudio) dom.sectionTranslateStudio.classList.toggle('hidden', tab !== 'translate');
  if (dom.sectionRankerStudio) dom.sectionRankerStudio.classList.toggle('hidden', tab !== 'ranker');
}

// Setup Groq API Settings UI
function initSettings() {
  dom.inputGroqApiKey.value = state.groqApiKey;
  dom.selectGroqModel.value = state.groqModel;
}

// Load Samples from Server
async function loadServerSamples() {
  try {
    const res = await fetch('/api/samples');
    if (!res.ok) return;
    const data = await res.json();
    state.sampleJDs = data.jobDescriptions || [];
    state.sampleResumes = data.sampleResumes || [];
  } catch (err) {
    console.warn('Failed loading samples:', err);
  }
}

function updateJdWordCount() {
  const text = dom.jobDescription.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  dom.jdWordCount.textContent = `${words} words`;
  checkReadyStates();
}

function checkReadyStates() {
  // Check Tab 1: Translation
  const transCount = state.transFiles.length + state.transSamples.length;
  dom.btnStartTranslation.disabled = transCount === 0;
  dom.transBtnText.textContent = transCount > 0 
    ? `Translate ${transCount} Resume${transCount > 1 ? 's' : ''} to Professional English`
    : 'Upload or Load Resumes to Translate';

  // Check Tab 2: Ranker
  const hasJd = dom.jobDescription.value.trim().length > 20;
  const rankCount = state.rankFiles.length + state.rankSamples.length;
  dom.btnRankAnalyze.disabled = !(hasJd && rankCount > 0);

  if (hasJd && rankCount > 0) {
    dom.rankBtnText.textContent = `Evaluate & Rank ${rankCount} Resume${rankCount > 1 ? 's' : ''} against JD`;
  } else if (!hasJd) {
    dom.rankBtnText.textContent = 'Please enter or select a Job Description first';
  } else {
    dom.rankBtnText.textContent = 'Please upload resumes or load samples for ranking';
  }
}

// Event Listeners Initialization
function initEventListeners() {
  // Engine switch buttons
  dom.engineBtnLocal.addEventListener('click', () => {
    setEngine('local');
    checkReadyStates();
  });

  dom.engineBtnGroq.addEventListener('click', () => {
    setEngine('groq');
    checkReadyStates();
  });

  // Settings modal
  dom.btnOpenSettings.addEventListener('click', () => {
    dom.settingsModal.classList.remove('hidden');
    dom.testKeyFeedback.classList.add('hidden');
  });

  dom.btnCloseSettings.addEventListener('click', () => dom.settingsModal.classList.add('hidden'));

  dom.toggleKeyVisibility.addEventListener('click', () => {
    dom.inputGroqApiKey.type = dom.inputGroqApiKey.type === 'password' ? 'text' : 'password';
  });

  dom.btnTestGroqKey.addEventListener('click', async () => {
    const testKey = dom.inputGroqApiKey.value.trim();
    if (!testKey) {
      showKeyFeedback('Please enter an AI API Key to test.', 'error');
      return;
    }
    showKeyFeedback('Testing AI Cloud connectivity...', 'loading');
    try {
      const res = await fetch('/api/test-groq-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: testKey })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showKeyFeedback('Success! Cloud AI Credentials verified and active.', 'success');
      } else {
        showKeyFeedback(`Connection Failed: ${data.message}`, 'error');
      }
    } catch (err) {
      showKeyFeedback(`Network error: ${err.message}`, 'error');
    }
  });

  dom.btnSaveSettings.addEventListener('click', () => {
    state.groqApiKey = dom.inputGroqApiKey.value.trim();
    state.groqModel = dom.selectGroqModel.value;
    localStorage.setItem('talentglobal_groq_key', state.groqApiKey);
    localStorage.setItem('talentglobal_groq_model', state.groqModel);
    if (state.groqApiKey) setEngine('groq');
    dom.settingsModal.classList.add('hidden');
  });

  // TAB 1: Translation Drag & Drop
  dom.dropZoneTrans.addEventListener('click', () => dom.fileInputTrans.click());
  dom.fileInputTrans.addEventListener('change', (e) => handleTransFiles(e.target.files));

  dom.dropZoneTrans.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.dropZoneTrans.classList.add('border-emerald-500', 'bg-emerald-50/50');
  });

  dom.dropZoneTrans.addEventListener('dragleave', () => {
    dom.dropZoneTrans.classList.remove('border-emerald-500', 'bg-emerald-50/50');
  });

  dom.dropZoneTrans.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.dropZoneTrans.classList.remove('border-emerald-500', 'bg-emerald-50/50');
    if (e.dataTransfer.files) handleTransFiles(e.dataTransfer.files);
  });

  dom.btnLoadTranslationSamples.addEventListener('click', () => {
    state.transSamples = [...state.sampleResumes];
    renderTransQueue();
    checkReadyStates();
  });

  dom.btnClearTransQueue.addEventListener('click', () => {
    state.transFiles = [];
    state.transSamples = [];
    dom.fileInputTrans.value = '';
    renderTransQueue();
    checkReadyStates();
  });

  dom.btnStartTranslation.addEventListener('click', runTranslationOnly);

  // TAB 2: Ranker Drag & Drop & JD
  dom.jobDescription.addEventListener('input', updateJdWordCount);
  dom.btnClearJd.addEventListener('click', () => {
    dom.jobDescription.value = '';
    updateJdWordCount();
  });

  dom.dropZoneRank.addEventListener('click', () => dom.fileInputRank.click());
  dom.fileInputRank.addEventListener('change', (e) => handleRankFiles(e.target.files));

  dom.dropZoneRank.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.dropZoneRank.classList.add('border-blue-500', 'bg-blue-50/50');
  });

  dom.dropZoneRank.addEventListener('dragleave', () => {
    dom.dropZoneRank.classList.remove('border-blue-500', 'bg-blue-50/50');
  });

  dom.dropZoneRank.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.dropZoneRank.classList.remove('border-blue-500', 'bg-blue-50/50');
    if (e.dataTransfer.files) handleRankFiles(e.dataTransfer.files);
  });

  dom.btnLoadRankerSamples.addEventListener('click', () => {
    state.rankSamples = [...state.sampleResumes];
    renderRankQueue();
    checkReadyStates();
  });

  dom.btnClearRankQueue.addEventListener('click', () => {
    state.rankFiles = [];
    state.rankSamples = [];
    dom.fileInputRank.value = '';
    renderRankQueue();
    checkReadyStates();
  });

  dom.btnRankAnalyze.addEventListener('click', runBatchRanker);

  // Ranker Filters & Sort
  dom.filterTier.addEventListener('change', (e) => {
    state.currentFilterTier = e.target.value;
    renderRankings();
  });

  dom.filterLanguage.addEventListener('change', (e) => {
    state.currentFilterLanguage = e.target.value;
    renderRankings();
  });

  dom.sortBy.addEventListener('change', (e) => {
    state.currentSort = e.target.value;
    renderRankings();
  });

  // Excel & Compare
  dom.btnExportExcel.addEventListener('click', exportToExcel);
  dom.btnCompareSelected.addEventListener('click', openCompareModal);
  dom.btnCloseCompare.addEventListener('click', () => dom.compareModal.classList.add('hidden'));

  // Modals
  dom.btnCloseModal.addEventListener('click', () => dom.candidateDetailModal.classList.add('hidden'));
  dom.modalBtnCloseBottom.addEventListener('click', () => dom.candidateDetailModal.classList.add('hidden'));
  dom.modalBtnPrint.addEventListener('click', () => window.print());
  if (dom.modalBtnDownloadPdf) {
    dom.modalBtnDownloadPdf.addEventListener('click', downloadModalCandidatePdf);
  }

  dom.btnCopyEnglish.addEventListener('click', () => {
    if (state.selectedCandidate) {
      navigator.clipboard.writeText(state.selectedCandidate.originalText || '');
      alert('Translated English text copied to clipboard!');
    }
  });

  dom.tabBtnDualPane.addEventListener('click', () => {
    dom.tabBtnDualPane.className = 'py-3 border-b-2 border-emerald-600 text-emerald-600 flex items-center gap-2';
    dom.tabBtnAtsReport.className = 'py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2';
    dom.viewDualPane.classList.remove('hidden');
    dom.viewAtsReport.classList.add('hidden');
  });

  dom.tabBtnAtsReport.addEventListener('click', () => {
    dom.tabBtnAtsReport.className = 'py-3 border-b-2 border-emerald-600 text-emerald-600 flex items-center gap-2';
    dom.tabBtnDualPane.className = 'py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2';
    dom.viewAtsReport.classList.remove('hidden');
    dom.viewDualPane.classList.add('hidden');
  });

  // Interview Scheduler Modal Listeners
  if (dom.btnOpenManualScheduler) {
    dom.btnOpenManualScheduler.addEventListener('click', () => openInterviewModal());
  }
  if (dom.btnCloseInterviewModal) {
    dom.btnCloseInterviewModal.addEventListener('click', closeInterviewModal);
  }
  if (dom.btnCancelInterviewModal) {
    dom.btnCancelInterviewModal.addEventListener('click', closeInterviewModal);
  }
  if (dom.btnConfirmScheduleInterview) {
    dom.btnConfirmScheduleInterview.addEventListener('click', handleConfirmInterviewSchedule);
  }
  if (dom.btnRegenerateZoom) {
    dom.btnRegenerateZoom.addEventListener('click', generateZoomMeetingCredentials);
  }
}

function showKeyFeedback(msg, type) {
  dom.testKeyFeedback.classList.remove('hidden', 'bg-emerald-50', 'text-emerald-800', 'bg-red-50', 'text-red-800', 'bg-blue-50', 'text-blue-800');
  if (type === 'success') {
    dom.testKeyFeedback.className = 'p-3 rounded-lg text-xs bg-emerald-50 border border-emerald-200 text-emerald-800';
  } else if (type === 'error') {
    dom.testKeyFeedback.className = 'p-3 rounded-lg text-xs bg-red-50 border border-red-200 text-red-800';
  } else {
    dom.testKeyFeedback.className = 'p-3 rounded-lg text-xs bg-blue-50 border border-blue-200 text-blue-800 animate-pulse';
  }
  dom.testKeyFeedback.textContent = msg;
}

// =========================================================================
// TAB 1 CONTROLLER: RESUME TRANSLATION ONLY (NO JD NEEDED)
// =========================================================================
function handleTransFiles(files) {
  if (!files || files.length === 0) return;
  for (let i = 0; i < files.length; i++) state.transFiles.push(files[i]);
  renderTransQueue();
  checkReadyStates();
}

function removeTransFile(idx, isSample = false) {
  if (isSample) state.transSamples.splice(idx, 1);
  else state.transFiles.splice(idx, 1);
  renderTransQueue();
  checkReadyStates();
}
window.removeTransFile = removeTransFile;

function renderTransQueue() {
  const total = state.transFiles.length + state.transSamples.length;
  dom.transQueueCount.textContent = total;

  if (total === 0) {
    dom.transQueueContainer.innerHTML = '<p class="text-xs text-slate-400 text-center py-4 italic">No files staged yet.</p>';
    dom.btnClearTransQueue.classList.add('hidden');
    return;
  }

  dom.btnClearTransQueue.classList.remove('hidden');
  dom.transQueueContainer.innerHTML = '';

  state.transFiles.forEach((file, idx) => {
    const ext = (file.name.split('.').pop() || 'FILE').toUpperCase();
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs';
    div.innerHTML = `
      <div class="flex items-center gap-2 overflow-hidden pr-2">
        <span class="px-1.5 py-0.5 rounded bg-slate-200 text-[10px] font-bold text-slate-700">${ext}</span>
        <span class="text-slate-800 truncate font-medium">${file.name}</span>
      </div>
      <button onclick="removeTransFile(${idx}, false)" class="text-slate-400 hover:text-red-500 p-1"><i class="fa-solid fa-xmark"></i></button>
    `;
    dom.transQueueContainer.appendChild(div);
  });

  state.transSamples.forEach((sample, idx) => {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs';
    div.innerHTML = `
      <div class="flex items-center gap-2 overflow-hidden pr-2">
        <span>${sample.languageFlag || '🌐'}</span>
        <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">${sample.language}</span>
        <span class="text-slate-800 truncate font-medium">${sample.filename}</span>
        <span class="text-emerald-700 text-[11px] font-semibold">${sample.candidateName}</span>
      </div>
      <button onclick="removeTransFile(${idx}, true)" class="text-slate-400 hover:text-red-500 p-1"><i class="fa-solid fa-xmark"></i></button>
    `;
    dom.transQueueContainer.appendChild(div);
  });
}

async function runTranslationOnly() {
  const hasUploaded = state.transFiles.length > 0;
  const hasSamples = state.transSamples.length > 0;
  if (!hasUploaded && !hasSamples) return;

  dom.transProgressCard.classList.remove('hidden');
  dom.transResultsSection.classList.add('hidden');
  dom.btnStartTranslation.disabled = true;

  updateTransProgress(20, 'Ingesting files and detecting source languages...');

  try {
    const formData = new FormData();
    formData.append('engine', state.currentEngine);
    formData.append('groqApiKey', state.groqApiKey);
    formData.append('model', state.groqModel);

    state.transFiles.forEach(file => formData.append('resumes', file));
    if (hasSamples) {
      formData.append('sampleIds', JSON.stringify(state.transSamples.map(s => s.id)));
    }

    updateTransProgress(50, `Translating with ${state.currentEngine === 'local' ? 'Standard Neural Engine' : 'High-Precision Cloud AI'}...`);

    const res = await fetch('/api/translate-only', {
      method: 'POST',
      body: formData
    });

    const data = await parseSafeJson(res);
    if (!res.ok) {
      throw new Error(data.error || 'Translation failed');
    }

    state.translatedResults = data.translations || [];

    updateTransProgress(100, 'Translations complete!');

    setTimeout(() => {
      dom.transProgressCard.classList.add('hidden');
      dom.transResultsSection.classList.remove('hidden');
      dom.btnStartTranslation.disabled = false;
      renderTranslatedCards();
      dom.transResultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 400);

  } catch (err) {
    alert('Translation Error: ' + err.message);
    dom.transProgressCard.classList.add('hidden');
    dom.btnStartTranslation.disabled = false;
  }
}

function updateTransProgress(percent, text) {
  dom.transProgressBar.style.width = `${percent}%`;
  dom.transProgressPercent.textContent = `${percent}%`;
  dom.transProgressText.textContent = text;
}

function renderTranslatedCards() {
  dom.transResultsCount.textContent = state.translatedResults.length;
  dom.transCardsContainer.innerHTML = '';

  state.translatedResults.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5';
    
    const candidate = item.candidate || {};
    const trans = item.translatedResume || {};

    card.innerHTML = `
      <!-- Header of Card -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div class="flex items-center gap-2">
            <h4 class="text-lg font-bold text-slate-900">${candidate.name || item.filename}</h4>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <span>${item.sampleFlag || '🌐'}</span>
              <span>${item.detectedLanguage}</span>
              <i class="fa-solid fa-arrow-right text-[10px]"></i>
              <span>English</span>
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            <i class="fa-solid fa-location-dot mr-1"></i> ${candidate.location || 'Global'} &bull; 
            <i class="fa-solid fa-briefcase mr-1"></i> ${candidate.yearsOfExperience || 0} Years Experience &bull; 
            <i class="fa-solid fa-file mr-1"></i> ${item.filename} (${item.format})
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="downloadTranslatedPdf(${idx})" class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-sm">
            <i class="fa-solid fa-file-pdf"></i> Download PDF
          </button>
          <button onclick="copyTranslatedText(${idx})" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors flex items-center gap-1.5 border border-slate-200">
            <i class="fa-solid fa-copy text-emerald-600"></i> Copy
          </button>
          <button onclick="downloadTranslatedFile(${idx})" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors flex items-center gap-1 border border-slate-200" title="Download Text">
            <i class="fa-solid fa-file-lines text-slate-500"></i> TXT
          </button>
        </div>
      </div>

      <!-- Side by Side Preview Inside Card -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        <!-- Left: Original Foreign Resume -->
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs text-slate-600 font-semibold">
            <span><i class="fa-solid fa-file-lines text-blue-600 mr-1"></i> Original (${item.detectedLanguage})</span>
            <span class="text-[10px] uppercase font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">${item.format}</span>
          </div>
          <pre class="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto select-text">${item.originalText}</pre>
        </div>

        <!-- Right: Translated English Resume -->
        <div class="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs text-emerald-700 font-semibold">
            <span><i class="fa-solid fa-language mr-1"></i> Standardized English Translation</span>
            <span class="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">Structure Preserved</span>
          </div>
          <div class="text-xs text-slate-800 space-y-3 max-h-72 overflow-y-auto pr-1">
            
            ${trans.summary ? `
              <div>
                <p class="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Professional Summary</p>
                <p class="leading-relaxed text-slate-700">${trans.summary}</p>
              </div>
            ` : ''}

            ${(candidate.topSkills && candidate.topSkills.length > 0) ? `
              <div>
                <p class="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Key Skills Extracted</p>
                <div class="flex flex-wrap gap-1">
                  ${candidate.topSkills.map(s => `<span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-800">${s}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            ${(trans.experience && trans.experience.length > 0) ? `
              <div class="space-y-2">
                <p class="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Experience</p>
                ${trans.experience.map(exp => `
                  <div class="border-l-2 border-emerald-500/50 pl-2.5 py-0.5">
                    <span class="font-bold text-slate-900">${exp.role}</span>
                    <p class="text-[11px] text-emerald-700 font-medium">${exp.company} ${exp.period ? `(${exp.period})` : ''}</p>
                    ${exp.details ? `<ul class="list-disc list-inside text-[11px] text-slate-600 mt-1">${exp.details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${(trans.education && trans.education.length > 0) ? `
              <div>
                <p class="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Education</p>
                ${trans.education.map(edu => `<p class="text-slate-800 font-medium">${edu.degree} - <span class="text-slate-500">${edu.institution}</span></p>`).join('')}
              </div>
            ` : ''}

          </div>
        </div>

      </div>
    `;

    dom.transCardsContainer.appendChild(card);
  });
}

function copyTranslatedText(idx) {
  const item = state.translatedResults[idx];
  if (!item) return;
  const content = item.translatedText || JSON.stringify(item.translatedResume, null, 2);
  navigator.clipboard.writeText(content);
  alert(`English translation for "${item.candidate?.name || item.filename}" copied to clipboard!`);
}
window.copyTranslatedText = copyTranslatedText;

function downloadTranslatedFile(idx) {
  const item = state.translatedResults[idx];
  if (!item) return;
  const content = item.translatedText || JSON.stringify(item.translatedResume, null, 2);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Translated_${item.filename.replace(/\.[^/.]+$/, '')}_EN.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
window.downloadTranslatedFile = downloadTranslatedFile;

// Clean printable HTML generator for high-resolution PDF download
function buildResumePrintHtml(item) {
  const candidate = item.candidate || {};
  const trans = item.translatedResume || {};

  return `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; padding: 24px; max-width: 800px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #059669; padding-bottom: 14px; margin-bottom: 18px;">
        <h1 style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.02em;">${candidate.name || item.filename}</h1>
        <p style="font-size: 13px; color: #475569; margin: 0 0 8px 0; line-height: 1.4;">
          <strong>Email:</strong> ${candidate.email || 'N/A'} &bull; 
          <strong>Phone:</strong> ${candidate.phone || 'N/A'} &bull; 
          <strong>Location:</strong> ${candidate.location || 'Global'}
        </p>
        <span style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 9999px;">
          Standardized English Translation (Source Language: ${item.detectedLanguage || 'Original'})
        </span>
      </div>

      <!-- Summary -->
      ${trans.summary ? `
        <div style="margin-bottom: 18px;">
          <h2 style="font-size: 13px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Professional Summary</h2>
          <p style="font-size: 12px; line-height: 1.6; color: #334155; margin: 0;">${trans.summary}</p>
        </div>
      ` : ''}

      <!-- Core Skills -->
      ${(candidate.topSkills && candidate.topSkills.length > 0) ? `
        <div style="margin-bottom: 18px;">
          <h2 style="font-size: 13px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Core Competencies & Key Skills</h2>
          <p style="font-size: 12px; line-height: 1.7; color: #0f172a; margin: 0; font-weight: 500;">
            ${candidate.topSkills.join(' &bull; ')}
          </p>
        </div>
      ` : ''}

      <!-- Work Experience -->
      ${(trans.experience && trans.experience.length > 0) ? `
        <div style="margin-bottom: 18px;">
          <h2 style="font-size: 13px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px;">Professional Experience</h2>
          ${trans.experience.map(exp => `
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <strong style="font-size: 13px; color: #0f172a; font-weight: 700;">${exp.role}</strong>
                <span style="font-size: 11px; color: #64748b; font-weight: 500;">${exp.period || ''}</span>
              </div>
              <p style="font-size: 12px; font-weight: 700; color: #059669; margin: 2px 0 4px 0;">${exp.company}</p>
              ${exp.details ? `
                <ul style="font-size: 11px; line-height: 1.55; color: #334155; margin: 0; padding-left: 18px;">
                  ${exp.details.map(d => `<li style="margin-bottom: 2px;">${d}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Education & Qualifications -->
      ${(trans.education && trans.education.length > 0) ? `
        <div style="margin-bottom: 18px;">
          <h2 style="font-size: 13px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Education & Academic Background</h2>
          ${trans.education.map(edu => `
            <p style="font-size: 12px; color: #334155; margin: 0 0 4px 0;">
              <strong style="color: #0f172a;">${edu.degree}</strong> &bull; ${edu.institution} ${edu.year ? `(${edu.year})` : ''}
            </p>
          `).join('')}
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 10px; color: #94a3b8; text-align: center;">
        Auto-Translated & Formatted by Hukam Kar &bull; Powered by Momin Tahir &bull; Original Document: ${item.filename}
      </div>
    </div>
  `;
}

function downloadTranslatedPdf(idx) {
  const item = state.translatedResults[idx];
  if (!item) return;

  const candidate = item.candidate || {};
  const cleanName = (candidate.name || item.filename).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Translated_${cleanName}_EN.pdf`;

  const container = document.createElement('div');
  container.id = 'temp-pdf-render';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.background = '#ffffff';
  container.innerHTML = buildResumePrintHtml(item);
  document.body.appendChild(container);

  if (window.html2pdf) {
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf()
      .set(opt)
      .from(container)
      .save()
      .then(() => {
        if (container.parentNode) document.body.removeChild(container);
      })
      .catch((err) => {
        console.error('PDF export error:', err);
        if (container.parentNode) document.body.removeChild(container);
      });
  } else {
    const printWin = window.open('', '_blank');
    printWin.document.write(`<html><head><title>${filename}</title></head><body>${container.innerHTML}</body></html>`);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    if (container.parentNode) document.body.removeChild(container);
  }
}
window.downloadTranslatedPdf = downloadTranslatedPdf;

function downloadModalCandidatePdf() {
  if (!state.selectedCandidate) return;
  const item = state.selectedCandidate;
  const candidate = item.candidate || {};
  const cleanName = (candidate.name || item.filename).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Translated_${cleanName}_EN.pdf`;

  const container = document.createElement('div');
  container.id = 'temp-pdf-render-modal';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.background = '#ffffff';
  container.innerHTML = buildResumePrintHtml(item);
  document.body.appendChild(container);

  if (window.html2pdf) {
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf()
      .set(opt)
      .from(container)
      .save()
      .then(() => {
        if (container.parentNode) document.body.removeChild(container);
      })
      .catch((err) => {
        console.error('Modal PDF export error:', err);
        if (container.parentNode) document.body.removeChild(container);
      });
  } else {
    const printWin = window.open('', '_blank');
    printWin.document.write(`<html><head><title>${filename}</title></head><body>${container.innerHTML}</body></html>`);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    if (container.parentNode) document.body.removeChild(container);
  }
}
window.downloadModalCandidatePdf = downloadModalCandidatePdf;

// =========================================================================
// TAB 2 CONTROLLER: SMART CV RANKER (WITH JD MATCHING)
// =========================================================================
function handleRankFiles(files) {
  if (!files || files.length === 0) return;
  for (let i = 0; i < files.length; i++) state.rankFiles.push(files[i]);
  renderRankQueue();
  checkReadyStates();
}

function removeRankFile(idx, isSample = false) {
  if (isSample) state.rankSamples.splice(idx, 1);
  else state.rankFiles.splice(idx, 1);
  renderRankQueue();
  checkReadyStates();
}
window.removeRankFile = removeRankFile;

function renderRankQueue() {
  const total = state.rankFiles.length + state.rankSamples.length;
  dom.rankQueueCount.textContent = total;

  if (total === 0) {
    dom.rankQueueContainer.innerHTML = '<p class="text-xs text-slate-400 text-center py-4 italic">No resumes uploaded yet.</p>';
    dom.btnClearRankQueue.classList.add('hidden');
    return;
  }

  dom.btnClearRankQueue.classList.remove('hidden');
  dom.rankQueueContainer.innerHTML = '';

  state.rankFiles.forEach((file, idx) => {
    const ext = (file.name.split('.').pop() || 'FILE').toUpperCase();
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs';
    div.innerHTML = `
      <div class="flex items-center gap-2 overflow-hidden pr-2">
        <span class="px-1.5 py-0.5 rounded bg-slate-200 text-[10px] font-bold text-slate-700">${ext}</span>
        <span class="text-slate-800 truncate font-medium">${file.name}</span>
      </div>
      <button onclick="removeRankFile(${idx}, false)" class="text-slate-400 hover:text-red-500 p-1"><i class="fa-solid fa-xmark"></i></button>
    `;
    dom.rankQueueContainer.appendChild(div);
  });

  state.rankSamples.forEach((sample, idx) => {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs';
    div.innerHTML = `
      <div class="flex items-center gap-2 overflow-hidden pr-2">
        <span>${sample.languageFlag || '🌐'}</span>
        <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">${sample.language}</span>
        <span class="text-slate-800 truncate font-medium">${sample.filename}</span>
        <span class="text-blue-700 text-[11px] font-semibold">${sample.candidateName}</span>
      </div>
      <button onclick="removeRankFile(${idx}, true)" class="text-slate-400 hover:text-red-500 p-1"><i class="fa-solid fa-xmark"></i></button>
    `;
    dom.rankQueueContainer.appendChild(div);
  });
}

async function runBatchRanker() {
  const jobDescription = dom.jobDescription.value.trim();
  if (!jobDescription) return;

  const hasUploaded = state.rankFiles.length > 0;
  const hasSamples = state.rankSamples.length > 0;
  if (!hasUploaded && !hasSamples) return;

  dom.rankProgressCard.classList.remove('hidden');
  dom.rankResultsSection.classList.add('hidden');
  dom.btnRankAnalyze.disabled = true;

  updateRankProgress(20, 'Stage 1/3: Reading files and detecting languages...');

  try {
    let combinedRankings = [];

    // 1. Process uploaded files
    if (hasUploaded) {
      updateRankProgress(45, `Stage 2/3: Semantic evaluation with ${state.currentEngine === 'local' ? 'Standard Neural Engine' : 'Advanced Cloud AI'}...`);
      const formData = new FormData();
      formData.append('jobDescription', jobDescription);
      formData.append('engine', state.currentEngine);
      formData.append('groqApiKey', state.groqApiKey);
      formData.append('model', state.groqModel);
      state.rankFiles.forEach(file => formData.append('resumes', file));

      const uploadRes = await fetch('/api/rank-resumes', {
        method: 'POST',
        body: formData
      });

      const uploadData = await parseSafeJson(uploadRes);
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Evaluation failed');
      }

      combinedRankings.push(...(uploadData.rankings || []));
    }

    // 2. Process staged samples
    if (hasSamples) {
      updateRankProgress(75, `Stage 2/3: Cross-lingual matching on ${state.rankSamples.length} multilingual resumes...`);
      const sampleRes = await fetch('/api/rank-samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          engine: state.currentEngine,
          groqApiKey: state.groqApiKey,
          model: state.groqModel,
          sampleIds: state.rankSamples.map(s => s.id)
        })
      });

      const sampleData = await parseSafeJson(sampleRes);
      if (!sampleRes.ok) {
        throw new Error(sampleData.error || 'Sample evaluation failed');
      }

      combinedRankings.push(...(sampleData.rankings || []));
    }

    updateRankProgress(95, 'Stage 3/3: Assigning Leaderboard ranks (#1, #2, #3...)...');

    // Sort descending by score
    combinedRankings.sort((a, b) => (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0));

    // Assign rank positions and badges
    combinedRankings.forEach((item, idx) => {
      item.rank = idx + 1;
      if (item.rank === 1) item.badge = '🥇 #1 Top Pick';
      else if (item.rank === 2) item.badge = '🥈 #2 Runner Up';
      else if (item.rank === 3) item.badge = '🥉 #3 Strong Contender';
      else item.badge = `#${item.rank}`;
      item.status = 'Reviewing';
    });

    state.rankings = combinedRankings;
    updateRankProgress(100, 'Ranking complete!');

    setTimeout(() => {
      dom.rankProgressCard.classList.add('hidden');
      dom.rankResultsSection.classList.remove('hidden');
      updateStats();
      populateLanguageFilter();
      renderRankings();
      dom.btnRankAnalyze.disabled = false;
      dom.rankResultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 400);

  } catch (err) {
    alert('Processing Error: ' + err.message);
    dom.rankProgressCard.classList.add('hidden');
    dom.btnRankAnalyze.disabled = false;
  }
}

function updateRankProgress(percent, text) {
  dom.rankProgressBar.style.width = `${percent}%`;
  dom.rankProgressPercent.textContent = `${percent}%`;
  dom.rankProgressText.textContent = text;
}

function updateStats() {
  const total = state.rankings.length;
  const topMatches = state.rankings.filter(r => (r.evaluation?.overallScore || 0) >= 90).length;
  const avg = total > 0 ? Math.round(state.rankings.reduce((acc, cur) => acc + (cur.evaluation?.overallScore || 0), 0) / total) : 0;
  const langs = [...new Set(state.rankings.map(r => r.detectedLanguage).filter(Boolean))];

  dom.statTotal.textContent = total;
  dom.statTopMatches.textContent = topMatches;
  dom.statAvgScore.textContent = `${avg}%`;
  dom.statLanguages.textContent = langs.join(', ') || '-';
}

function populateLanguageFilter() {
  const langs = [...new Set(state.rankings.map(r => r.detectedLanguage).filter(Boolean))];
  dom.filterLanguage.innerHTML = '<option value="ALL">All Languages</option>';
  langs.forEach(lang => {
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = lang;
    dom.filterLanguage.appendChild(opt);
  });
}

function renderRankings() {
  let list = [...state.rankings];

  if (state.currentFilterTier !== 'ALL') {
    list = list.filter(r => r.evaluation?.rankTier === state.currentFilterTier);
  }
  if (state.currentFilterLanguage !== 'ALL') {
    list = list.filter(r => r.detectedLanguage === state.currentFilterLanguage);
  }

  if (state.currentSort === 'score_desc') {
    list.sort((a, b) => (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0));
  } else if (state.currentSort === 'score_asc') {
    list.sort((a, b) => (a.evaluation?.overallScore || 0) - (b.evaluation?.overallScore || 0));
  } else if (state.currentSort === 'exp_desc') {
    list.sort((a, b) => (b.candidate?.yearsOfExperience || 0) - (a.candidate?.yearsOfExperience || 0));
  } else if (state.currentSort === 'name_asc') {
    list.sort((a, b) => (a.candidate?.name || '').localeCompare(b.candidate?.name || ''));
  }

  dom.candidatesGrid.innerHTML = '';
  if (list.length === 0) {
    dom.candidatesGrid.innerHTML = '<div class="text-center py-10 bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">No candidates match selected criteria.</div>';
    return;
  }

  list.forEach(candidate => {
    const card = createRankCard(candidate);
    dom.candidatesGrid.appendChild(card);
  });
}

function createRankCard(cand) {
  const score = cand.evaluation?.overallScore || 0;
  const rank = cand.rank || '-';
  const tier = cand.evaluation?.rankTier || 'Moderate Match';
  const detectedLang = cand.detectedLanguage || 'Original';
  const exp = cand.candidate?.yearsOfExperience || 0;

  let scoreColorClass = 'text-emerald-700 border-emerald-200 bg-emerald-50';
  let tierBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let rankBadgeClass = 'bg-emerald-600 text-white font-bold shadow-sm';

  if (score < 50) {
    scoreColorClass = 'text-red-700 border-red-200 bg-red-50';
    tierBadgeClass = 'bg-red-50 text-red-800 border-red-200';
    rankBadgeClass = 'bg-slate-600 text-white font-bold';
  } else if (score < 75) {
    scoreColorClass = 'text-amber-700 border-amber-200 bg-amber-50';
    tierBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
    rankBadgeClass = 'bg-amber-600 text-white font-bold';
  } else if (score < 90) {
    scoreColorClass = 'text-blue-700 border-blue-200 bg-blue-50';
    tierBadgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
    rankBadgeClass = 'bg-blue-600 text-white font-bold';
  }

  const isChecked = state.selectedForComparison.has(cand.id);
  const scheduledIntv = state.scheduledInterviews.find(i => i.candidateId === cand.id || i.candidateName === (cand.candidate?.name || cand.filename));
  if (scheduledIntv) {
    cand.status = 'Interview';
  }

  const card = document.createElement('div');
  card.className = 'bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm transition-all duration-200';
  
  if (rank === 1) card.classList.add('ring-2', 'ring-emerald-500/30');

  const strengthsPreview = (cand.evaluation?.strengths || []).slice(0, 2);
  const skillsPreview = (cand.candidate?.topSkills || []).slice(0, 4);

  card.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-start gap-4">
        <div class="flex flex-col items-center gap-2">
          <input type="checkbox" onchange="toggleCompareCandidate('${cand.id}')" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer">
          <span class="px-2.5 py-1 rounded-full text-xs ${rankBadgeClass}">${cand.badge || `#${rank}`}</span>
        </div>
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h4 class="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors" onclick="openCandidateDetail('${cand.id}')">
              ${cand.candidate?.name || cand.filename}
            </h4>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold border ${tierBadgeClass}">${tier}</span>
            <span class="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 font-medium">
              <span>${cand.sampleFlag || '🌐'}</span>
              <span><strong>${detectedLang}</strong></span>
              <i class="fa-solid fa-arrow-right text-[9px] text-emerald-600"></i>
              <span class="text-emerald-700 font-semibold">English</span>
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
            <span><i class="fa-solid fa-briefcase text-slate-400 mr-1"></i> ${exp} Years Exp</span>
            <span><i class="fa-solid fa-location-dot text-slate-400 mr-1"></i> ${cand.candidate?.location || 'Global'}</span>
            <span><i class="fa-solid fa-file text-slate-400 mr-1"></i> ${cand.filename} (${cand.fileFormat})</span>
          </div>

          <div class="flex flex-wrap items-center gap-1.5 mt-2.5">
            ${skillsPreview.map(s => `<span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-mono">${s}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-16 h-16 rounded-2xl flex flex-col items-center justify-center border ${scoreColorClass}">
            <span class="text-xl font-black leading-none">${score}%</span>
            <span class="text-[9px] uppercase font-bold tracking-wider opacity-80 mt-0.5">Match</span>
          </div>
          <div class="text-[11px] space-y-1 text-slate-500 hidden lg:block">
            <div class="flex justify-between gap-3"><span>Skills:</span> <strong class="text-slate-800">${cand.evaluation?.breakdown?.skillsScore || score}%</strong></div>
            <div class="flex justify-between gap-3"><span>Experience:</span> <strong class="text-slate-800">${cand.evaluation?.breakdown?.experienceScore || score}%</strong></div>
            <div class="flex justify-between gap-3"><span>Education:</span> <strong class="text-slate-800">${cand.evaluation?.breakdown?.educationScore || score}%</strong></div>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <button onclick="openCandidateDetail('${cand.id}')" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 shadow-sm">
            <i class="fa-solid fa-magnifying-glass text-blue-600"></i>
            <span>Deep ATS Fit</span>
          </button>
          
          <div class="flex items-center gap-1.5">
            <select onchange="updateCandidateStatus('${cand.id}', this.value)" class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 font-medium focus:outline-none focus:border-indigo-600">
              <option value="Reviewing" ${cand.status === 'Reviewing' ? 'selected' : ''}>⏳ Reviewing</option>
              <option value="Shortlisted" ${cand.status === 'Shortlisted' ? 'selected' : ''}>⭐ Shortlisted</option>
              <option value="Interview" ${cand.status === 'Interview' ? 'selected' : ''}>📞 Interview Call</option>
              <option value="Rejected" ${cand.status === 'Rejected' ? 'selected' : ''}>❌ Rejected</option>
            </select>
            <button onclick="openInterviewModal('${cand.id}')" title="Schedule Zoom & Outlook Interview" class="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-colors">
              <i class="fa-solid fa-calendar-plus text-indigo-600"></i>
              <span>Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    ${scheduledIntv ? `
      <div class="mt-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 via-blue-50 to-emerald-50 border border-indigo-200 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="font-bold text-indigo-900"><i class="fa-solid fa-calendar-check text-indigo-600 mr-1"></i> Interview Confirmed:</span>
          <span class="font-semibold text-slate-800">${scheduledIntv.scheduledDate} at ${scheduledIntv.scheduledTime} (${scheduledIntv.timezone})</span>
          <span class="text-slate-600 font-medium">&bull; with ${scheduledIntv.hiringManagerName}</span>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="launchDesktopApp('${scheduledIntv.id}', 'outlook')" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all" title="Directly launch Microsoft Outlook app on this laptop">
            <i class="fa-solid fa-calendar-check"></i> Open Outlook
          </button>
          <button onclick="launchDesktopApp('${scheduledIntv.id}', 'zoom')" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all" title="Directly launch Zoom app on this laptop">
            <i class="fa-solid fa-video"></i> Open Zoom
          </button>
          <button onclick="launchOutlookEmail('${scheduledIntv.id}')" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-all" title="Compose Outlook Email">
            <i class="fa-regular fa-envelope text-blue-600"></i> Email
          </button>
          <button onclick="downloadInterviewICS('${scheduledIntv.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-[11px]" title="Download .ics backup file">
            <i class="fa-solid fa-download"></i>
          </button>
        </div>
      </div>
    ` : ''}

    ${strengthsPreview.length > 0 ? `
      <div class="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <span class="text-emerald-700 font-semibold text-[11px]"><i class="fa-solid fa-circle-check mr-1"></i>Strengths:</span>
        ${strengthsPreview.map(str => `<span class="truncate max-w-md">&bull; ${str}</span>`).join('')}
      </div>
    ` : ''}
  `;

  return card;
}

function toggleCompareCandidate(id) {
  if (state.selectedForComparison.has(id)) {
    state.selectedForComparison.delete(id);
  } else {
    if (state.selectedForComparison.size >= 3) {
      alert('You can compare a maximum of 3 candidates simultaneously.');
      return;
    }
    state.selectedForComparison.add(id);
  }
  dom.compareSelectedCount.textContent = state.selectedForComparison.size;
}
window.toggleCompareCandidate = toggleCompareCandidate;

function updateCandidateStatus(id, newStatus) {
  const cand = state.rankings.find(r => r.id === id);
  if (!cand) return;
  cand.status = newStatus;
  
  if (newStatus === 'Interview') {
    openInterviewModal(id);
  }
}
window.updateCandidateStatus = updateCandidateStatus;

// Detail Modal
function openCandidateDetail(id) {
  const cand = state.rankings.find(r => r.id === id);
  if (!cand) return;

  state.selectedCandidate = cand;

  dom.modalCandidateId.textContent = cand.id;
  dom.modalCandidateName.textContent = cand.candidate?.name || cand.filename;
  dom.modalSubInfo.textContent = `Original Language: ${cand.detectedLanguage || 'Original'} | Location: ${cand.candidate?.location || 'International'} | Experience: ${cand.candidate?.yearsOfExperience || 0} Years`;
  dom.modalRankBadge.textContent = cand.badge || `#${cand.rank}`;

  dom.modalOriginalLang.textContent = cand.detectedLanguage || 'Original';
  dom.modalFormatBadge.textContent = cand.fileFormat || 'PDF';
  dom.modalOriginalContent.textContent = cand.originalText || 'No raw text extracted.';

  // English translation rendering
  const trans = cand.translatedResume || {};
  dom.modalEnglishContent.innerHTML = `
    <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
      <h5 class="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Professional Summary</h5>
      <p class="leading-relaxed text-slate-700">${trans.summary || 'Summary not provided'}</p>
    </div>
    <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
      <h5 class="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2">Core Skills</h5>
      <div class="flex flex-wrap gap-1.5">
        ${(trans.skills || cand.candidate?.topSkills || []).map(s => `<span class="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] text-slate-800 font-mono">${s}</span>`).join('')}
      </div>
    </div>
    <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
      <h5 class="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Employment History</h5>
      ${(trans.experience && trans.experience.length > 0) ? trans.experience.map(exp => `
        <div class="border-l-2 border-emerald-500/50 pl-3 py-1 space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-900">${exp.role}</span>
            <span class="text-[10px] text-slate-500">${exp.period || ''}</span>
          </div>
          <p class="text-[11px] text-emerald-700 font-medium">${exp.company}</p>
          ${exp.details ? `<ul class="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">${exp.details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
        </div>
      `).join('') : '<p class="text-slate-500 italic">No experience entries formatted.</p>'}
    </div>
  `;

  // ATS Evaluation tab
  const ev = cand.evaluation || {};
  const bd = ev.breakdown || {};
  dom.modalSkillsScore.textContent = `${bd.skillsScore || ev.overallScore || 0}%`;
  dom.modalExpScore.textContent = `${bd.experienceScore || ev.overallScore || 0}%`;
  dom.modalEduScore.textContent = `${bd.educationScore || ev.overallScore || 0}%`;
  dom.modalRoleScore.textContent = `${bd.roleRelevanceScore || ev.overallScore || 0}%`;
  dom.modalHrRecommendation.textContent = ev.hrRecommendation || 'Strong candidate recommendation.';

  dom.modalStrengthsList.innerHTML = (ev.strengths || []).map(s => `<li class="flex items-start gap-2"><i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i><span>${s}</span></li>`).join('');
  dom.modalGapsList.innerHTML = (ev.gapsOrMissingSkills || []).map(g => `<li class="flex items-start gap-2"><i class="fa-solid fa-triangle-exclamation text-amber-600 mt-0.5"></i><span>${g}</span></li>`).join('');
  dom.modalQuestionsList.innerHTML = (ev.interviewQuestions || []).map(q => `<li class="flex items-start gap-2 bg-blue-50/60 p-2.5 rounded-lg border border-blue-200"><i class="fa-solid fa-circle-question text-blue-600 mt-0.5"></i><span class="text-slate-800 font-medium">${q}</span></li>`).join('');

  dom.candidateDetailModal.classList.remove('hidden');
}
window.openCandidateDetail = openCandidateDetail;

// Compare Modal
function openCompareModal() {
  if (state.selectedForComparison.size === 0) {
    alert('Please check at least 2 candidate checkboxes on the cards to compare.');
    return;
  }
  const cands = state.rankings.filter(r => state.selectedForComparison.has(r.id));
  dom.compareGrid.innerHTML = '';
  cands.forEach(cand => {
    const col = document.createElement('div');
    col.className = 'bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col space-y-4 shadow-sm';
    col.innerHTML = `
      <div class="border-b border-slate-200 pb-3">
        <span class="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">${cand.badge}</span>
        <h4 class="text-base font-bold text-slate-900 mt-1">${cand.candidate?.name}</h4>
        <p class="text-xs text-slate-500">${cand.detectedLanguage} &bull; ${cand.candidate?.yearsOfExperience || 0} Years Exp</p>
        <div class="mt-2 text-2xl font-black text-blue-600">${cand.evaluation?.overallScore}% Fit</div>
      </div>
      <div class="text-xs space-y-1">
        <div class="flex justify-between"><span>Skills:</span> <strong class="text-emerald-700">${cand.evaluation?.breakdown?.skillsScore}%</strong></div>
        <div class="flex justify-between"><span>Experience:</span> <strong class="text-blue-700">${cand.evaluation?.breakdown?.experienceScore}%</strong></div>
        <div class="flex justify-between"><span>Education:</span> <strong class="text-purple-700">${cand.evaluation?.breakdown?.educationScore}%</strong></div>
      </div>
      <div>
        <h5 class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Top Skills</h5>
        <div class="flex flex-wrap gap-1">
          ${(cand.candidate?.topSkills || []).map(s => `<span class="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-700 font-mono">${s}</span>`).join('')}
        </div>
      </div>
      <div class="flex-1">
        <h5 class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Key Strengths</h5>
        <ul class="text-xs text-slate-700 space-y-1">
          ${(cand.evaluation?.strengths || []).map(s => `<li>&bull; ${s}</li>`).join('')}
        </ul>
      </div>
      <button onclick="openCandidateDetail('${cand.id}'); dom.compareModal.classList.add('hidden');" class="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors shadow-sm">
        View Full Dossier
      </button>
    `;
    dom.compareGrid.appendChild(col);
  });
  dom.compareModal.classList.remove('hidden');
}

// Export to Excel
async function exportToExcel() {
  if (state.rankings.length === 0) {
    alert('No candidates evaluated yet to export.');
    return;
  }
  try {
    const res = await fetch('/api/export-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rankings: state.rankings,
        jdTitle: dom.presetJdSelect?.value || 'Job Requisition'
      })
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Candidate_Rankings_Report_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Excel Export Error: ' + err.message);
  }
}

// =========================================================================
// INTERVIEW SCHEDULING CONTROLLER (ZOOM + MICROSOFT OUTLOOK)
// =========================================================================
async function initInterviews() {
  try {
    const res = await fetch('/api/scheduled-interviews');
    if (res.ok) {
      const data = await res.json();
      if (data.interviews && Array.isArray(data.interviews)) {
        state.scheduledInterviews = data.interviews;
      }
    }
  } catch (err) {
    console.warn('Could not load interviews from server, falling back to local storage:', err);
    try {
      const cached = localStorage.getItem('talentglobal_interviews');
      if (cached) state.scheduledInterviews = JSON.parse(cached);
    } catch (e) {}
  }
  renderScheduledInterviews();
}

function renderScheduledInterviews() {
  if (!dom.scheduledInterviewsList) return;
  const list = state.scheduledInterviews || [];
  
  if (dom.interviewPipelineCount) {
    dom.interviewPipelineCount.textContent = `${list.length} Scheduled`;
  }

  if (list.length === 0) {
    dom.scheduledInterviewsList.innerHTML = `
      <div id="emptyInterviewsNotice" class="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <i class="fa-solid fa-video text-slate-300 text-3xl mb-2"></i>
        <p class="text-xs font-semibold text-slate-700">No candidate interviews scheduled yet.</p>
        <p class="text-[11px] text-slate-400 mt-0.5">Select <span class="font-bold text-indigo-600">"📞 Interview Call"</span> on any candidate card below to automatically setup Zoom and Outlook calendar invites.</p>
      </div>
    `;
    return;
  }

  dom.scheduledInterviewsList.innerHTML = '';
  list.forEach(item => {
    const div = document.createElement('div');
    div.className = 'bg-slate-50 border border-indigo-200 hover:border-indigo-300 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-sm';
    
    // Format friendly date
    const d = new Date(`${item.scheduledDate}T${item.scheduledTime}:00`);
    const dateFormatted = !isNaN(d.getTime()) 
      ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : item.scheduledDate;

    div.innerHTML = `
      <div class="flex items-start sm:items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shadow-indigo-500/20 flex-shrink-0">
          <i class="fa-solid fa-video"></i>
        </div>
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h4 class="text-sm font-bold text-slate-900">${item.candidateName}</h4>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">${item.candidateScore || 85}% Fit</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Confirmed Zoom Call
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
            <span class="font-semibold text-indigo-700">
              <i class="fa-regular fa-calendar text-indigo-600 mr-1"></i> ${dateFormatted} at ${item.scheduledTime} (${item.timezone || 'Local'})
            </span>
            <span>&bull;</span>
            <span><i class="fa-solid fa-user-tie text-slate-400 mr-1"></i> Interviewer: <strong>${item.hiringManagerName}</strong> (${item.hiringManagerEmail})</span>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1.5">
            <span class="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-slate-700">Zoom ID: ${item.zoomMeetingId}</span>
            <span class="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-slate-700">Passcode: ${item.zoomPasscode}</span>
            <span class="text-slate-400">&bull; Duration: ${item.durationMinutes} mins</span>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
        <button onclick="launchDesktopApp('${item.id}', 'outlook')" class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5" title="Directly launch Microsoft Outlook app on this laptop">
          <i class="fa-solid fa-calendar-check"></i>
          <span>Open Outlook</span>
        </button>
        <button onclick="launchDesktopApp('${item.id}', 'zoom')" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5" title="Directly launch Zoom app on this laptop">
          <i class="fa-solid fa-video"></i>
          <span>Open Zoom</span>
        </button>
        <button onclick="launchOutlookEmail('${item.id}')" class="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1" title="Open Outlook draft email">
          <i class="fa-regular fa-envelope text-blue-600"></i>
          <span>Email</span>
        </button>
        <button onclick="downloadInterviewICS('${item.id}')" class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all text-xs" title="Download .ics backup file">
          <i class="fa-solid fa-download"></i>
        </button>
        <button onclick="cancelScheduledInterview('${item.id}')" class="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all text-xs" title="Cancel scheduled interview">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;

    dom.scheduledInterviewsList.appendChild(div);
  });
}

function generateZoomMeetingCredentials() {
  const p1 = Math.floor(100 + Math.random() * 900);
  const p2 = Math.floor(1000 + Math.random() * 9000);
  const p3 = Math.floor(1000 + Math.random() * 9000);
  const meetingId = `${p1} ${p2} ${p3}`;
  const passcode = Math.floor(100000 + Math.random() * 900000).toString();
  const rawId = meetingId.replace(/\s+/g, '');
  const url = `https://zoom.us/j/${rawId}?pwd=${passcode}`;

  if (dom.schZoomIdDisplay) dom.schZoomIdDisplay.textContent = meetingId;
  if (dom.schZoomPassDisplay) dom.schZoomPassDisplay.textContent = passcode;
  if (dom.schZoomUrlInput) dom.schZoomUrlInput.value = url;
}

function openInterviewModal(candidateId) {
  let cand = null;
  if (candidateId) {
    cand = state.rankings.find(r => r.id === candidateId);
  } else if (state.rankings.length > 0) {
    cand = state.rankings[0];
  }

  state.activeSchedulingCandidate = cand;

  const candName = cand?.candidate?.name || cand?.filename || 'Selected Candidate';
  const score = cand?.evaluation?.overallScore || 85;
  const badge = cand?.badge || '#1 Match';
  const lang = cand?.detectedLanguage || 'Original';
  const exp = cand?.candidate?.yearsOfExperience || 0;
  const email = cand?.candidate?.email || `${candName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@candidate-global.com`;

  if (dom.schCandidateNameDisplay) dom.schCandidateNameDisplay.textContent = candName;
  if (dom.schCandidateSubDisplay) dom.schCandidateSubDisplay.textContent = `Match Fit: ${score}% &bull; Language: ${lang} &bull; ${exp} Years Experience`;
  if (dom.schCandidateBadge) dom.schCandidateBadge.textContent = badge;

  if (dom.schCandidateName) dom.schCandidateName.value = candName;
  if (dom.schCandidateEmail) dom.schCandidateEmail.value = email;

  // Default Hiring Manager
  if (dom.schHiringManagerName && !dom.schHiringManagerName.value) {
    dom.schHiringManagerName.value = 'Farhan Ahmed (VP Engineering)';
  }
  if (dom.schHiringManagerEmail && !dom.schHiringManagerEmail.value) {
    dom.schHiringManagerEmail.value = 'farhan.ahmed@hukamkar.ai';
  }

  // Default Date: Tomorrow
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = tomorrow.getFullYear();
  const mm = pad(tomorrow.getMonth() + 1);
  const dd = pad(tomorrow.getDate());
  if (dom.schInterviewDate) dom.schInterviewDate.value = `${yyyy}-${mm}-${dd}`;
  if (dom.schInterviewTime) dom.schInterviewTime.value = '10:00';

  // Topic
  if (dom.schMeetingTitle) dom.schMeetingTitle.value = `Technical & Fit Interview - ${candName}`;

  // Recruiter Questions into notes
  const questions = cand?.evaluation?.interviewQuestions || [];
  if (dom.schNotes) {
    if (questions.length > 0) {
      dom.schNotes.value = `Suggested Interview Questions:\n` + questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    } else {
      dom.schNotes.value = `Candidate ATS Fit: ${score}%\nPlease review resume dossier prior to the call.`;
    }
  }

  generateZoomMeetingCredentials();

  if (dom.interviewModal) dom.interviewModal.classList.remove('hidden');
}
window.openInterviewModal = openInterviewModal;

function closeInterviewModal() {
  if (dom.interviewModal) dom.interviewModal.classList.add('hidden');
  state.activeSchedulingCandidate = null;
}
window.closeInterviewModal = closeInterviewModal;

async function handleConfirmInterviewSchedule() {
  const candName = dom.schCandidateName ? dom.schCandidateName.value.trim() : '';
  const date = dom.schInterviewDate ? dom.schInterviewDate.value : '';
  const time = dom.schInterviewTime ? dom.schInterviewTime.value : '';
  const hiringManagerName = dom.schHiringManagerName ? dom.schHiringManagerName.value.trim() : 'Hiring Manager';
  const hiringManagerEmail = dom.schHiringManagerEmail ? dom.schHiringManagerEmail.value.trim() : 'manager@company.com';
  const candEmail = dom.schCandidateEmail ? dom.schCandidateEmail.value.trim() : 'candidate@hukamkar.ai';
  const duration = dom.schDuration ? (parseInt(dom.schDuration.value, 10) || 45) : 45;
  const timezone = dom.schTimezone ? dom.schTimezone.value : 'Asia/Karachi (PKT GMT+5)';
  const meetingTitle = dom.schMeetingTitle ? dom.schMeetingTitle.value.trim() : `Interview with ${candName}`;
  const customZoomUrl = dom.schZoomUrlInput ? dom.schZoomUrlInput.value.trim() : '';
  const notes = dom.schNotes ? dom.schNotes.value.trim() : '';

  if (!candName || !date || !time) {
    alert('Please fill in candidate name, date and time.');
    return;
  }

  const activeCand = state.activeSchedulingCandidate;

  const payload = {
    candidateId: activeCand ? activeCand.id : ('cand_' + Date.now()),
    candidateName: candName,
    candidateEmail: candEmail,
    candidateScore: activeCand?.evaluation?.overallScore || 85,
    candidateSkills: activeCand?.candidate?.topSkills || [],
    hiringManagerName,
    hiringManagerEmail,
    scheduledDate: date,
    scheduledTime: time,
    durationMinutes: duration,
    timezone,
    meetingTitle,
    customZoomUrl,
    notes,
    autoLaunchOutlook: dom.chkLaunchOutlook ? dom.chkLaunchOutlook.checked : true,
    autoLaunchZoom: dom.chkLaunchZoom ? dom.chkLaunchZoom.checked : false
  };

  const autoLaunchOutlook = dom.chkLaunchOutlook ? dom.chkLaunchOutlook.checked : true;
  const autoLaunchZoom = dom.chkLaunchZoom ? dom.chkLaunchZoom.checked : false;
  const downloadIcs = dom.chkDownloadIcs ? dom.chkDownloadIcs.checked : false;

  try {
    const res = await fetch('/api/schedule-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to schedule');
    }

    const data = await res.json();
    const scheduled = data.interview;

    // Update in-memory interviews
    state.scheduledInterviews.unshift(scheduled);
    localStorage.setItem('talentglobal_interviews', JSON.stringify(state.scheduledInterviews));

    // Update candidate status
    if (activeCand) {
      activeCand.status = 'Interview';
    }

    closeInterviewModal();
    renderScheduledInterviews();
    renderRankings();

    // Browser protocol fallback for Zoom if selected
    if (autoLaunchZoom && scheduled.zoomAppUrl) {
      window.location.href = scheduled.zoomAppUrl;
    }

    // Only download file IF explicitly chosen by user!
    if (downloadIcs) {
      downloadInterviewICS(scheduled.id);
    }

    let msg = `✅ Interview scheduled for ${candName}!`;
    if (autoLaunchOutlook && autoLaunchZoom) {
      msg = `🚀 Microsoft Outlook desktop & Zoom apps launched on your laptop!`;
    } else if (autoLaunchOutlook) {
      msg = `🚀 Microsoft Outlook desktop app launched on your laptop with appointment ready!`;
    } else if (autoLaunchZoom) {
      msg = `🎥 Zoom desktop app launched on your laptop!`;
    }
    showToast(msg, 'success');

    // Scroll to the interview pipeline bar so the user sees it aligned
    if (dom.interviewPipelineBar) {
      dom.interviewPipelineBar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } catch (err) {
    alert('Error scheduling interview: ' + err.message);
  }
}
window.handleConfirmInterviewSchedule = handleConfirmInterviewSchedule;

async function launchDesktopApp(id, appType) {
  const intv = state.scheduledInterviews.find(i => i.id === id);
  if (!intv) return;

  const appName = appType === 'outlook' ? 'Microsoft Outlook' : 'Zoom';
  showToast(`🚀 Launching ${appName} on your laptop...`, 'info');

  try {
    const res = await fetch('/api/launch-app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, appType })
    });
    if (res.ok) {
      showToast(`✅ ${appName} opened directly on your laptop!`, 'success');
    }
  } catch (e) {
    console.warn('API launch failed, trying fallback:', e);
  }

  // Browser protocol fallback
  if (appType === 'zoom') {
    if (intv.zoomAppUrl) window.location.href = intv.zoomAppUrl;
    else window.open(intv.zoomJoinUrl, '_blank');
  }
}
window.launchDesktopApp = launchDesktopApp;

function downloadInterviewICS(id) {
  const intv = state.scheduledInterviews.find(i => i.id === id);
  if (!intv) return;

  const link = document.createElement('a');
  link.href = `/api/interview-ics/${id}`;
  link.download = `Interview_${(intv.candidateName || 'Candidate').replace(/\s+/g, '_')}_Outlook.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(`📅 Calendar event (.ics) downloaded. Opening in Microsoft Outlook...`, 'info');
}
window.downloadInterviewICS = downloadInterviewICS;

function launchOutlookEmail(id) {
  const intv = state.scheduledInterviews.find(i => i.id === id);
  if (!intv) return;

  const subject = encodeURIComponent(`Invitation: ${intv.meetingTitle}`);
  const body = encodeURIComponent(
    `Hello ${intv.candidateName} and ${intv.hiringManagerName},\n\n` +
    `Your upcoming interview has been confirmed via Hukam Kar (Powered by Momin Tahir).\n\n` +
    `Topic: ${intv.meetingTitle}\n` +
    `Date: ${intv.scheduledDate}\n` +
    `Time: ${intv.scheduledTime} (${intv.timezone})\n` +
    `Duration: ${intv.durationMinutes} Minutes\n\n` +
    `JOIN ZOOM MEETING:\n` +
    `${intv.zoomJoinUrl}\n\n` +
    `Meeting ID: ${intv.zoomMeetingId}\n` +
    `Passcode: ${intv.zoomPasscode}\n\n` +
    `Candidate Profile Match: ${intv.candidateScore}%\n\n` +
    `Best regards,\nHukam Kar Recruitment Team • Powered by Momin Tahir`
  );

  window.open(`mailto:${intv.candidateEmail};${intv.hiringManagerEmail}?subject=${subject}&body=${body}`, '_blank');
  showToast('Opening draft in Microsoft Outlook email...', 'info');
}
window.launchOutlookEmail = launchOutlookEmail;

async function cancelScheduledInterview(id) {
  if (!confirm('Are you sure you want to cancel this scheduled interview?')) return;

  try {
    await fetch(`/api/schedule-interview/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('Server delete failed, updating local state:', e);
  }

  state.scheduledInterviews = state.scheduledInterviews.filter(i => i.id !== id);
  localStorage.setItem('talentglobal_interviews', JSON.stringify(state.scheduledInterviews));

  renderScheduledInterviews();
  renderRankings();
  showToast('Interview cancelled.', 'info');
}
window.cancelScheduledInterview = cancelScheduledInterview;

function showToast(message, type = 'success') {
  if (!dom.toastContainer) return;
  const toast = document.createElement('div');
  const bg = type === 'error' ? 'bg-red-600' : (type === 'info' ? 'bg-indigo-600' : 'bg-emerald-600');
  toast.className = `${bg} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-xs font-semibold pointer-events-auto transform transition-all duration-300 translate-y-2 opacity-0 max-w-md`;
  const icon = type === 'error' ? 'fa-circle-exclamation' : (type === 'info' ? 'fa-circle-info' : 'fa-circle-check');
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-base"></i>
    <span class="flex-1">${message}</span>
    <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
  `;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}
window.showToast = showToast;




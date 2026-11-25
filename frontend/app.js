// ============================================================================
// OTET Exam System - Modern Client Application with Autosave & Analytics
// ============================================================================

const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:8080/api/v1';

// App State
let isBackendOnline = false;
let currentAttemptId = null;
let currentPaperCode = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // { [qId]: optionIndex }
let markedForReview = new Set();
let visitedQuestions = new Set();
let timerInterval = null;
let timeLeft = 150 * 60; // seconds
let currentLang = 'en'; // 'en' or 'or'
let lastSubmissionResult = null;
let allPapersCache = [];
let currentFilter = 'all';
let autosaveTimeout = null;
let activeRecoveryAttempt = null;

// DOM Elements
const views = {
    landing: document.getElementById('landing-view'),
    dashboard: document.getElementById('dashboard-view'),
    quiz: document.getElementById('quiz-view'),
    result: document.getElementById('result-view')
};

const serverStatusPill = document.getElementById('server-status-pill');
const serverStatusText = document.getElementById('server-status-text');
const autosaveIndicator = document.getElementById('autosave-indicator');
const autosaveText = document.getElementById('autosave-text');
const timerDisplay = document.getElementById('timer');
const recoveryBanner = document.getElementById('recovery-banner');
const recoveryText = document.getElementById('recovery-text');

// Form Inputs
const candidateNameInput = document.getElementById('candidate-name');
const candidateEmailInput = document.getElementById('candidate-email');
const dashboardEmailInput = document.getElementById('dashboard-email-input');

// Navigation
const navCatalogBtn = document.getElementById('nav-catalog-btn');
const navDashboardBtn = document.getElementById('nav-dashboard-btn');
const btnResumeExam = document.getElementById('btn-resume-exam');
const btnDiscardExam = document.getElementById('btn-discard-exam');
const btnLoadHistory = document.getElementById('btn-load-history');

// Quiz Elements
const qText = document.getElementById('q-text');
const optionsContainer = document.getElementById('options-container');
const qNumber = document.getElementById('q-number');
const totalQ = document.getElementById('total-q');
const currentSubject = document.getElementById('current-subject');
const paletteGrid = document.getElementById('palette-grid');

// Quiz Buttons
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnSubmit = document.getElementById('btn-submit');
const btnMark = document.getElementById('btn-mark');
const btnClear = document.getElementById('btn-clear');
const btnLang = document.getElementById('lang-toggle');
const btnReviewToggle = document.getElementById('btn-review-toggle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    restoreCandidateProfile();
    setupEventListeners();
    checkBackendHealth();
    checkActiveRecovery();
});

function restoreCandidateProfile() {
    const savedName = localStorage.getItem('otet_candidate_name');
    const savedEmail = localStorage.getItem('otet_candidate_email');
    if (savedName) candidateNameInput.value = savedName;
    if (savedEmail) {
        candidateEmailInput.value = savedEmail;
        dashboardEmailInput.value = savedEmail;
    }
}

function persistCandidateProfile() {
    const name = candidateNameInput.value.trim();
    const email = candidateEmailInput.value.trim().toLowerCase();
    if (name) localStorage.setItem('otet_candidate_name', name);
    if (email) {
        localStorage.setItem('otet_candidate_email', email);
        dashboardEmailInput.value = email;
    }
}

function setupEventListeners() {
    // Navigation tabs
    navCatalogBtn.addEventListener('click', () => switchMainTab('catalog'));
    navDashboardBtn.addEventListener('click', () => {
        switchMainTab('dashboard');
        loadStudentHistory();
    });

    // Profile auto-persist
    candidateNameInput.addEventListener('input', persistCandidateProfile);
    candidateEmailInput.addEventListener('input', () => {
        persistCandidateProfile();
        checkActiveRecovery();
    });

    // Recovery banner buttons
    btnResumeExam.addEventListener('click', resumeActiveExam);
    btnDiscardExam.addEventListener('click', discardActiveExam);

    // Dashboard
    btnLoadHistory.addEventListener('click', loadStudentHistory);

    // Quiz controls
    btnPrev.addEventListener('click', () => navigate(-1));
    btnNext.addEventListener('click', () => navigate(1));
    btnSubmit.addEventListener('click', () => {
        if (confirm("Are you sure you want to submit the exam? Answers will be scored on the server.")) {
            submitExam();
        }
    });
    btnMark.addEventListener('click', toggleMarkReview);
    btnClear.addEventListener('click', clearCurrentAnswer);
    btnLang.addEventListener('click', toggleLanguage);
    btnReviewToggle.addEventListener('click', toggleDetailedReview);

    // Paper card selection delegation
    document.getElementById('papers-container').addEventListener('click', (e) => {
        const startBtn = e.target.closest('.start-btn') || e.target.closest('.paper-card');
        if (startBtn) {
            const paperCode = startBtn.getAttribute('data-paper');
            if (paperCode) startQuiz(paperCode);
        }
    });

    // Category filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter');
            renderPapersList();
        });
    });
}

function switchMainTab(tab) {
    if (views.quiz.style.display !== 'none') {
        if (!confirm("You have an active exam running. Leave to view dashboard? Progress will be autosaved.")) return;
    }

    if (tab === 'catalog') {
        navCatalogBtn.classList.add('active');
        navDashboardBtn.classList.remove('active');
        switchView('landing');
    } else {
        navCatalogBtn.classList.remove('active');
        navDashboardBtn.classList.add('active');
        switchView('dashboard');
    }
}

// ----------------------------------------------------------------------------
// Backend Connectivity & Active Exam Recovery
// ----------------------------------------------------------------------------
async function checkBackendHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
        if (res.ok) {
            isBackendOnline = true;
            serverStatusPill.className = 'server-status online';
            serverStatusText.textContent = 'Backend: Spring Boot (Online)';
            await loadAvailablePapers();
            return;
        }
    } catch (e) {
        // Backend not currently reachable
    }

    isBackendOnline = false;
    serverStatusPill.className = 'server-status offline';
    serverStatusText.textContent = 'Local Standalone Mode (1,228+ Qs)';
    allPapersCache = getOfflinePapersCatalog();
    renderPapersList();
}

async function checkActiveRecovery() {
    const email = candidateEmailInput.value.trim().toLowerCase();
    
    // Check localStorage recovery first
    const cachedState = localStorage.getItem('otet_active_exam');
    if (cachedState) {
        try {
            const parsed = JSON.parse(cachedState);
            if (parsed && parsed.remainingSeconds > 0) {
                activeRecoveryAttempt = parsed;
                recoveryBanner.style.display = 'flex';
                recoveryText.textContent = `You have an ongoing test for "${parsed.paperTitle || parsed.paperCode}" with ${Math.ceil(parsed.remainingSeconds / 60)} minutes remaining.`;
                return;
            }
        } catch (e) {}
    }

    // Check backend recovery if online
    if (isBackendOnline && email) {
        try {
            const res = await fetch(`${API_BASE}/students/${encodeURIComponent(email)}/active`);
            if (res.status === 200) {
                const active = await res.json();
                if (active) {
                    activeRecoveryAttempt = active;
                    recoveryBanner.style.display = 'flex';
                    recoveryText.textContent = `Server recovery found for "${active.paperTitle}" (${active.weakAreasSummary}).`;
                    return;
                }
            }
        } catch (err) {}
    }

    recoveryBanner.style.display = 'none';
}

function discardActiveExam() {
    localStorage.removeItem('otet_active_exam');
    activeRecoveryAttempt = null;
    recoveryBanner.style.display = 'none';
}

async function resumeActiveExam() {
    if (!activeRecoveryAttempt) return;
    recoveryBanner.style.display = 'none';
    await startQuiz(activeRecoveryAttempt.paperCode, true);
}

// ----------------------------------------------------------------------------
// Paper Catalog Loading
// ----------------------------------------------------------------------------
async function loadAvailablePapers() {
    try {
        const res = await fetch(`${API_BASE}/tests`);
        if (res.ok) {
            allPapersCache = await res.json();
            renderPapersList();
        }
    } catch (err) {
        allPapersCache = getOfflinePapersCatalog();
        renderPapersList();
    }
}

function renderPapersList() {
    const container = document.getElementById('papers-container');
    container.innerHTML = '';

    let filtered = allPapersCache;
    if (currentFilter === 'full') {
        filtered = allPapersCache.filter(p => p.totalQuestions >= 150);
    } else if (currentFilter === 'subject') {
        filtered = allPapersCache.filter(p => p.paperCode.startsWith('subject-'));
    } else if (currentFilter === 'stream') {
        filtered = allPapersCache.filter(p => p.paperCode.includes('p2') || p.paperCode.includes('social') || p.paperCode.includes('science'));
    }

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'paper-card';
        card.setAttribute('data-paper', p.paperCode);

        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.textContent = p.targetClass || 'Official Exam';

        const h2 = document.createElement('h2');
        h2.textContent = p.title;

        const desc = document.createElement('p');
        desc.textContent = p.description || `${p.totalQuestions} Questions · ${p.durationMinutes} Minutes`;

        const btn = document.createElement('button');
        btn.className = 'btn-primary start-btn';
        btn.setAttribute('data-paper', p.paperCode);
        btn.textContent = `Start Mock (${p.totalQuestions} Qs)`;

        card.appendChild(tag);
        card.appendChild(h2);
        card.appendChild(desc);
        card.appendChild(btn);
        container.appendChild(card);
    });
}

// ----------------------------------------------------------------------------
// Quiz Lifecycle & Stateful Autosave
// ----------------------------------------------------------------------------
async function startQuiz(paperCode, isResume = false) {
    persistCandidateProfile();
    currentPaperCode = paperCode;
    serverStatusText.textContent = 'Initializing Exam Session...';

    const candidateName = candidateNameInput.value.trim() || 'Candidate';
    const candidateEmail = candidateEmailInput.value.trim().toLowerCase() || 'guest@otet.edu';

    try {
        let startResponse = null;

        if (isBackendOnline) {
            const res = await fetch(`${API_BASE}/tests/${paperCode}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateName, candidateEmail })
            });
            if (res.ok) {
                startResponse = await res.json();
            }
        }

        if (startResponse) {
            currentAttemptId = startResponse.attemptId;
            currentQuestions = startResponse.questions || [];
            userAnswers = startResponse.savedAnswers || {};
            currentQuestionIndex = startResponse.currentQuestionIndex || 0;
            timeLeft = startResponse.remainingSeconds > 0 ? startResponse.remainingSeconds : startResponse.durationMinutes * 60;
        } else {
            // Offline fallback
            currentAttemptId = Date.now();
            currentQuestions = getMockQuestionsFallback(paperCode);
            userAnswers = {};
            currentQuestionIndex = 0;
            timeLeft = 150 * 60;

            // Check if local cache has answers for resume
            const cached = localStorage.getItem('otet_active_exam');
            if (cached && isResume) {
                const parsed = JSON.parse(cached);
                if (parsed.paperCode === paperCode) {
                    userAnswers = parsed.answers || {};
                    currentQuestionIndex = parsed.currentQuestionIndex || 0;
                    timeLeft = parsed.remainingSeconds || timeLeft;
                }
            }
        }

        markedForReview.clear();
        visitedQuestions.clear();
        visitedQuestions.add(currentQuestionIndex);

        switchView('quiz');
        timerDisplay.style.display = 'block';
        autosaveIndicator.style.display = 'flex';
        totalQ.textContent = currentQuestions.length;

        renderPalette();
        loadQuestion(currentQuestionIndex);
        startTimer();

        // Autosave heartbeat
        scheduleAutosave();
    } catch (err) {
        console.error('Error starting quiz:', err);
        alert('Could not start test: ' + err.message);
    }
}

function switchView(viewName) {
    Object.values(views).forEach(el => el.style.display = 'none');
    views[viewName].style.display = 'block';
    if (viewName === 'quiz') views[viewName].style.display = 'grid';
    if (viewName === 'landing' || viewName === 'dashboard') {
        timerDisplay.style.display = 'none';
        autosaveIndicator.style.display = 'none';
    }
}

function loadQuestion(index) {
    if (index < 0 || index >= currentQuestions.length) return;

    currentQuestionIndex = index;
    const q = currentQuestions[index];

    visitedQuestions.add(index);
    updatePaletteStatus(index);

    currentSubject.textContent = q.subject || 'General';
    const subjColors = {
        'Child Development & Pedagogy': '#ffedd5',
        'CDP': '#ffedd5',
        'Language I (Odia)': '#fae8ff',
        'Odia': '#fae8ff',
        'Language II (English)': '#e0e7ff',
        'English': '#e0e7ff',
        'Mathematics': '#dcfce7',
        'Math': '#dcfce7',
        'Science': '#dbeafe',
        'Social Studies': '#fef3c7',
        'Environmental Studies (EVS)': '#ecfdf5'
    };
    currentSubject.style.background = subjColors[q.subject] || '#f1f5f9';

    qNumber.textContent = index + 1;

    const questionText = (q.q && q.q[currentLang]) ? q.q[currentLang] : (q.q && q.q['en'] ? q.q['en'] : 'Question text');
    qText.textContent = questionText;

    optionsContainer.innerHTML = '';
    const opts = (q.options && q.options[currentLang]) ? q.options[currentLang] : (q.options && q.options['en'] ? q.options['en'] : []);

    opts.forEach((optText, optIndex) => {
        const div = document.createElement('div');
        div.className = `option-item ${userAnswers[q.id] === optIndex ? 'selected' : ''}`;

        const circle = document.createElement('div');
        circle.className = 'circle';

        const span = document.createElement('span');
        span.textContent = optText;

        div.appendChild(circle);
        div.appendChild(span);
        div.addEventListener('click', () => selectOption(q.id, optIndex));
        optionsContainer.appendChild(div);
    });

    btnPrev.disabled = index === 0;
    btnNext.textContent = index === currentQuestions.length - 1 ? 'Finish & Review' : 'Next';

    if (markedForReview.has(index)) {
        btnMark.textContent = 'Unmark Review';
        btnMark.style.borderColor = 'var(--warning)';
    } else {
        btnMark.textContent = 'Mark for Review';
        btnMark.style.borderColor = 'var(--border)';
    }
}

function selectOption(qId, optIndex) {
    userAnswers[qId] = optIndex;
    updatePaletteStatus(currentQuestionIndex);
    loadQuestion(currentQuestionIndex);
    triggerImmediateAutosave();
}

function clearCurrentAnswer() {
    const q = currentQuestions[currentQuestionIndex];
    if (q && userAnswers[q.id] !== undefined) {
        delete userAnswers[q.id];
        updatePaletteStatus(currentQuestionIndex);
        loadQuestion(currentQuestionIndex);
        triggerImmediateAutosave();
    }
}

function toggleMarkReview() {
    if (markedForReview.has(currentQuestionIndex)) {
        markedForReview.delete(currentQuestionIndex);
    } else {
        markedForReview.add(currentQuestionIndex);
    }
    updatePaletteStatus(currentQuestionIndex);
    loadQuestion(currentQuestionIndex);
}

function navigate(direction) {
    loadQuestion(currentQuestionIndex + direction);
    triggerImmediateAutosave();
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'or' : 'en';
    btnLang.textContent = currentLang === 'en' ? 'Switch to ଓଡ଼ିଆ' : 'Switch to English';
    if (views.quiz.style.display !== 'none') {
        loadQuestion(currentQuestionIndex);
    }
}

// ----------------------------------------------------------------------------
// Real-Time Autosave Engine
// ----------------------------------------------------------------------------
function triggerImmediateAutosave() {
    // 1. Instant local persistence (Zero network latency)
    const statePayload = {
        attemptId: currentAttemptId,
        paperCode: currentPaperCode,
        remainingSeconds: timeLeft,
        currentQuestionIndex: currentQuestionIndex,
        answers: userAnswers,
        timestamp: Date.now()
    };
    localStorage.setItem('otet_active_exam', JSON.stringify(statePayload));

    // 2. Debounced backend sync
    if (autosaveTimeout) clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(syncAutosaveToBackend, 800);
}

function scheduleAutosave() {
    // Background sync heartbeat every 15 seconds
    setInterval(() => {
        if (views.quiz.style.display !== 'none' && currentAttemptId) {
            syncAutosaveToBackend();
        }
    }, 15000);
}

async function syncAutosaveToBackend() {
    if (!isBackendOnline || !currentAttemptId) return;

    autosaveIndicator.className = 'autosave-indicator syncing';
    autosaveText.textContent = 'Syncing...';

    try {
        const payload = {
            remainingSeconds: timeLeft,
            currentQuestionIndex: currentQuestionIndex,
            answers: userAnswers
        };
        const res = await fetch(`${API_BASE}/attempts/${currentAttemptId}/autosave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            autosaveIndicator.className = 'autosave-indicator';
            autosaveText.textContent = 'Autosaved';
        }
    } catch (e) {
        autosaveIndicator.className = 'autosave-indicator';
        autosaveText.textContent = 'Saved Locally';
    }
}

// ----------------------------------------------------------------------------
// Timer
// ----------------------------------------------------------------------------
function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time is up! Submitting your exam automatically.");
            submitExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    timerDisplay.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ----------------------------------------------------------------------------
// Question Palette
// ----------------------------------------------------------------------------
function renderPalette() {
    paletteGrid.innerHTML = '';
    currentQuestions.forEach((q, i) => {
        const btn = document.createElement('button');
        btn.textContent = i + 1;
        btn.id = `palette-${i}`;
        btn.addEventListener('click', () => loadQuestion(i));
        paletteGrid.appendChild(btn);
    });
}

function updatePaletteStatus(index) {
    const btn = document.getElementById(`palette-${index}`);
    if (!btn) return;

    const qId = currentQuestions[index].id;
    let cls = '';
    if (index === currentQuestionIndex) cls += ' active';

    if (markedForReview.has(index)) {
        cls += ' marked';
    } else if (userAnswers[qId] !== undefined) {
        cls += ' answered';
    } else if (visitedQuestions.has(index)) {
        cls += ' visited';
    }
    btn.className = cls.trim();

    Array.from(paletteGrid.children).forEach((b, i) => {
        if (i !== index) b.classList.remove('active');
    });
}

// ----------------------------------------------------------------------------
// Exam Submission & Result Engine
// ----------------------------------------------------------------------------
async function submitExam() {
    clearInterval(timerInterval);
    switchView('result');
    localStorage.removeItem('otet_active_exam'); // Clear ongoing state

    let result = null;

    if (isBackendOnline && currentAttemptId) {
        try {
            const res = await fetch(`${API_BASE}/attempts/${currentAttemptId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: userAnswers })
            });
            if (res.ok) {
                result = await res.json();
            }
        } catch (err) {
            console.warn('Backend submission failed, evaluating locally:', err);
        }
    }

    if (!result) {
        result = evaluateLocally();
    }

    lastSubmissionResult = result;
    displayResults(result);
}

function evaluateLocally() {
    let score = 0, correct = 0, wrong = 0, skipped = 0;
    const subjectStats = {};
    const reviews = [];
    const weakSubjects = [];

    currentQuestions.forEach((q) => {
        const subj = q.subject || 'General';
        if (!subjectStats[subj]) subjectStats[subj] = { total: 0, correct: 0, percentage: 0 };
        subjectStats[subj].total++;

        const userSel = userAnswers[q.id];
        const correctAns = (q.answer !== undefined) ? q.answer : 0;
        let isCorrect = false;

        if (userSel === undefined) {
            skipped++;
        } else if (userSel === correctAns) {
            score++;
            correct++;
            isCorrect = true;
            subjectStats[subj].correct++;
        } else {
            wrong++;
        }

        reviews.push({
            questionId: q.id,
            questionNumber: q.questionNumber || q.id,
            subject: subj,
            userSelectedOption: userSel,
            correctOptionIndex: correctAns,
            isCorrect: isCorrect,
            explanation: q.explanation || "Official answer key reference."
        });
    });

    Object.keys(subjectStats).forEach(s => {
        const item = subjectStats[s];
        item.percentage = item.total ? Math.round((item.correct / item.total) * 100) : 0;
        if (item.percentage < 55) {
            weakSubjects.push(`${s} (${item.percentage}%)`);
        }
    });

    const pct = currentQuestions.length ? (score / currentQuestions.length) * 100 : 0;
    const diag = weakSubjects.length > 0
        ? `Focus Revision Required: ${weakSubjects.join(', ')}. Review theoretical concepts and time management.`
        : "Excellent balanced mastery across all subjects. Maintain testing consistency.";

    return {
        score,
        totalQuestions: currentQuestions.length,
        correctCount: correct,
        wrongCount: wrong,
        skippedCount: skipped,
        percentage: Math.round(pct * 10) / 10,
        passed: pct >= 60,
        weakAreasSummary: diag,
        subjectBreakdown: subjectStats,
        reviews
    };
}

function displayResults(result) {
    document.getElementById('score-display').textContent = result.score;
    document.getElementById('result-total-display').textContent = result.totalQuestions;
    document.getElementById('stat-correct').textContent = result.correctCount;
    document.getElementById('stat-wrong').textContent = result.wrongCount;
    document.getElementById('stat-skip').textContent = result.skippedCount;

    const scoreMsg = document.getElementById('score-msg');
    if (result.passed) {
        scoreMsg.textContent = `🎉 Qualified! You scored ${result.percentage}% (Cutoff 60% passed).`;
        scoreMsg.style.color = 'var(--success)';
    } else {
        scoreMsg.textContent = `Score: ${result.percentage}%. Target 60% (90/150) to qualify for OTET.`;
        scoreMsg.style.color = 'var(--text-main)';
    }

    // Diagnostic Callout
    document.getElementById('result-diagnostic-text').textContent = result.weakAreasSummary || "Focus on Child Development & Pedagogy core concepts.";

    // Render Subject-wise Performance
    const breakdownContainer = document.getElementById('subject-breakdown-container');
    breakdownContainer.innerHTML = '<h3 style="margin: 1.5rem 0 0.75rem; text-align: left;">Subject Performance Breakdown</h3>';

    if (result.subjectBreakdown) {
        Object.entries(result.subjectBreakdown).forEach(([subj, data]) => {
            const pct = Math.round(data.percentage);
            const color = pct >= 60 ? 'var(--success)' : (pct >= 40 ? 'var(--warning)' : 'var(--danger)');

            const div = document.createElement('div');
            div.style.marginTop = '0.6rem';
            div.style.textAlign = 'left';

            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.innerHTML = `<strong>${subj}</strong> <span>${data.correct}/${data.total} (${pct}%)</span>`;

            const barBg = document.createElement('div');
            barBg.style.background = '#e2e8f0';
            barBg.style.height = '8px';
            barBg.style.borderRadius = '4px';
            barBg.style.marginTop = '3px';

            const barFill = document.createElement('div');
            barFill.style.background = color;
            barFill.style.width = `${pct}%`;
            barFill.style.height = '100%';
            barFill.style.borderRadius = '4px';

            barBg.appendChild(barFill);
            div.appendChild(header);
            div.appendChild(barBg);
            breakdownContainer.appendChild(div);
        });
    }

    renderReviewsList(result.reviews);
}

function renderReviewsList(reviews) {
    const list = document.getElementById('reviews-list');
    list.innerHTML = '';
    if (!reviews || reviews.length === 0) return;

    reviews.forEach((rev, idx) => {
        const qOriginal = currentQuestions.find(q => q.id === rev.questionId) || currentQuestions[idx];
        const statusClass = rev.userSelectedOption === undefined || rev.userSelectedOption === null
            ? 'skipped' : (rev.isCorrect ? 'correct' : 'wrong');
        const badgeText = statusClass.toUpperCase();

        const card = document.createElement('div');
        card.className = `review-item ${statusClass}`;

        const header = document.createElement('div');
        header.className = 'review-header';
        header.innerHTML = `<span><strong>Q${rev.questionNumber || idx + 1}:</strong> ${rev.subject}</span> <span class="review-badge ${statusClass}">${badgeText}</span>`;

        const qP = document.createElement('p');
        qP.style.fontWeight = '500';
        qP.style.margin = '0.5rem 0';
        qP.textContent = (qOriginal && qOriginal.q && qOriginal.q[currentLang]) ? qOriginal.q[currentLang] : (qOriginal && qOriginal.q && qOriginal.q.en ? qOriginal.q.en : 'Question');

        const optList = document.createElement('div');
        optList.className = 'review-opt-list';

        const opts = (qOriginal && qOriginal.options && qOriginal.options[currentLang]) ? qOriginal.options[currentLang] : (qOriginal && qOriginal.options && qOriginal.options.en ? qOriginal.options.en : []);

        opts.forEach((optText, oIdx) => {
            const optDiv = document.createElement('div');
            let optClass = 'review-opt';
            if (oIdx === rev.correctOptionIndex) {
                optClass += ' is-correct';
                optDiv.textContent = `✔ ${optText} (Correct Answer)`;
            } else if (oIdx === rev.userSelectedOption && !rev.isCorrect) {
                optClass += ' user-picked-wrong';
                optDiv.textContent = `✖ ${optText} (Your Choice)`;
            } else {
                optDiv.textContent = `${String.fromCharCode(65 + oIdx)}. ${optText}`;
            }
            optDiv.className = optClass;
            optList.appendChild(optDiv);
        });

        card.appendChild(header);
        card.appendChild(qP);
        card.appendChild(optList);

        if (rev.explanation) {
            const exp = document.createElement('div');
            exp.style.fontSize = '0.85rem';
            exp.style.color = 'var(--text-light)';
            exp.style.marginTop = '0.5rem';
            exp.textContent = `💡 Note: ${rev.explanation}`;
            card.appendChild(exp);
        }

        list.appendChild(card);
    });
}

function toggleDetailedReview() {
    const section = document.getElementById('detailed-review-section');
    if (section.style.display === 'none') {
        section.style.display = 'block';
        btnReviewToggle.textContent = 'Hide Detailed Question Review';
        section.scrollIntoView({ behavior: 'smooth' });
    } else {
        section.style.display = 'none';
        btnReviewToggle.textContent = 'Show Detailed Question Review';
    }
}

// ----------------------------------------------------------------------------
// Student Dashboard & Attempt History
// ----------------------------------------------------------------------------
async function loadStudentHistory() {
    const email = dashboardEmailInput.value.trim().toLowerCase() || candidateEmailInput.value.trim().toLowerCase();
    const tbody = document.getElementById('history-table-body');
    const diagBox = document.getElementById('diagnostic-summary-box');
    const diagText = document.getElementById('diagnostic-summary-text');

    if (!email) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-light); padding: 2rem;">Please enter an email address to view attempt history.</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Loading history records...</td></tr>';

    try {
        let history = [];
        if (isBackendOnline) {
            const res = await fetch(`${API_BASE}/students/${encodeURIComponent(email)}/history`);
            if (res.ok) {
                history = await res.json();
            }
        }

        if (!history || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-light); padding: 2rem;">No test attempts found for this email. Take your first test from the Test Series tab!</td></tr>';
            diagBox.style.display = 'none';
            return;
        }

        tbody.innerHTML = '';
        diagBox.style.display = 'block';
        diagText.textContent = history[0].weakAreasSummary || "Continuous practice recommended across Child Development and Pedagogy.";

        history.forEach(item => {
            const tr = document.createElement('tr');
            const dateStr = item.startTime ? new Date(item.startTime).toLocaleDateString() + ' ' + new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';
            const statusBadge = item.passed
                ? '<span style="color: var(--success); font-weight: 700;">QUALIFIED</span>'
                : '<span style="color: var(--danger); font-weight: 700;">NEEDS PRACTICE</span>';

            tr.innerHTML = `
                <td><strong>${item.paperTitle}</strong></td>
                <td>${dateStr}</td>
                <td>${item.score} / ${item.totalQuestions}</td>
                <td><strong>${item.percentage}%</strong></td>
                <td>${statusBadge}</td>
                <td><span style="font-size: 0.8rem; color: var(--text-light);">${item.weakAreasSummary || 'Completed'}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 2rem;">Failed to fetch history: ${err.message}</td></tr>`;
    }
}

// ----------------------------------------------------------------------------
// Offline Fallback Catalog (12 Test Papers)
// ----------------------------------------------------------------------------
function getOfflinePapersCatalog() {
    return [
        {
                "paperCode": "otet-2019-p1-shift3",
                "title": "OTET Official Paper-I (Full Mock - Shift 3)",
                "description": "Primary Level (Classes I-V) · Complete 150 Marks · CDP (30), Odia (30), English (30), Math (30), EVS (30)",
                "targetClass": "Classes I to V",
                "durationMinutes": 150,
                "totalQuestions": 150
        },
        {
                "paperCode": "otet-2019-p2-shift2",
                "title": "OTET Official Paper-II (Full Mock - Shift 2)",
                "description": "Upper Primary (Classes VI-VIII) · Complete 150 Marks · CDP, Languages, Optional Subject",
                "targetClass": "Classes VI to VIII",
                "durationMinutes": 150,
                "totalQuestions": 150
        },
        {
                "paperCode": "otet-2019-p2-shift3",
                "title": "OTET Official Paper-II (Full Mock - Shift 3)",
                "description": "Upper Primary (Classes VI-VIII) · Complete 150 Marks · CDP, Languages, Optional Subject",
                "targetClass": "Classes VI to VIII",
                "durationMinutes": 150,
                "totalQuestions": 150
        },
        {
                "paperCode": "otet-2019-p2-shift1",
                "title": "OTET Official Paper-II (Full Mock - Shift 1)",
                "description": "Upper Primary (Classes VI-VIII) · Complete 150 Marks · CDP, Languages, Optional Subject",
                "targetClass": "Classes VI to VIII",
                "durationMinutes": 150,
                "totalQuestions": 150
        },
        {
                "paperCode": "otet-2019-p2-18aug",
                "title": "OTET Official Paper-II (Full Mock - 18 Aug Shift)",
                "description": "Upper Primary (Classes VI-VIII) · Complete 150 Marks · CDP, Languages, Optional Subject",
                "targetClass": "Classes VI to VIII",
                "durationMinutes": 150,
                "totalQuestions": 150
        },
        {
                "paperCode": "subject-cdp-mastery",
                "title": "Child Development & Pedagogy (High-Yield Practice)",
                "description": "Topic-wise Mastery Test · 60 Questions covering Piaget, Vygotsky, Kohlberg, and Inclusive Education",
                "targetClass": "Paper 1 & Paper 2",
                "durationMinutes": 60,
                "totalQuestions": 60
        },
        {
                "paperCode": "subject-math-mastery",
                "title": "Mathematics & Pedagogy (Practice Module)",
                "description": "Topic-wise Mastery Test · 50 Questions covering Numbers, Geometry, Algebra, and Math Pedagogy",
                "targetClass": "Primary & Upper Primary",
                "durationMinutes": 60,
                "totalQuestions": 50
        },
        {
                "paperCode": "subject-lang-mastery",
                "title": "Languages (Odia & English Practice Module)",
                "description": "Topic-wise Mastery Test · 60 Questions covering Grammar, Reading Comprehension, and Language Pedagogy",
                "targetClass": "Paper 1 & Paper 2",
                "durationMinutes": 60,
                "totalQuestions": 60
        },
        {
                "paperCode": "paper2-social",
                "title": "OTET Paper 2 (Upper Primary - Social Studies)",
                "description": "Eligibility mock test for Upper Primary Teachers (Classes VI to VIII) in Social Studies stream.",
                "targetClass": "Classes VI to VIII",
                "durationMinutes": 150,
                "totalQuestions": 118
        },
        {
                "paperCode": "paper2-science",
                "title": "OTET Paper 2 (Upper Primary - Math & Science)",
                "description": "Eligibility mock test for Upper Primary Teachers (Classes VI to VIII) in Mathematics & Science stream.",
                "targetClass": "Classes VI to VIII",
                "durationMinutes": 150,
                "totalQuestions": 82
        },
        {
                "paperCode": "otet-2024-p2-arts",
                "title": "OTET 2024 Official Paper-II (Arts & Social Studies - 17 Aug)",
                "description": "Latest Official Exam · Held on 17 August 2024 · CDP, Languages, History, Geography, Polity",
                "targetClass": "Classes VI to VIII",
                "durationMinutes": 150,
                "totalQuestions": 74
        },
        {
                "paperCode": "otet-2024-p2-science",
                "title": "OTET 2024 Official Paper-II (Science & Math - 17 Aug)",
                "description": "Latest Official Exam · Held on 17 August 2024 · CDP, Languages, Mathematics, Physics, Chemistry, Biology",
                "targetClass": "Classes VI to VIII",
                "durationMinutes": 150,
                "totalQuestions": 34
        }
    ];
}

function getMockQuestionsFallback(paperCode) {
    return [
        {
            id: 1,
            subject: "Child Development & Pedagogy",
            q: { en: "Which of the following is not a characteristic of ‘Sensory Motor Stage’ of cognitive development of a child?", or: "ନିମ୍ନଲିଖିତ ମଧ୍ୟରୁ କେଉଁଟି ଶିଶୁର ଜ୍ଞାନାତ୍ମକ ବିକାଶର 'ସଂବେଦୀ ଚାଳକ ସ୍ତର' ର ଏକ ବୈଶିଷ୍ଟ୍ୟ ନୁହେଁ ?" },
            options: {
                en: ["Imitative behaviour", "Language development", "Learning through senses", "Reflex plays a crucial role"],
                or: ["ଅନୁକରଣୀୟ ବ୍ୟବହାର", "ଭାଷା ବିକାଶ", "ଇନ୍ଦ୍ରିୟ ଦ୍ୱାରା ଶିକ୍ଷା", "ପ୍ରତିବର୍ତ୍ତ ଏକ ମୁଖ୍ୟ ଭୂମିକା ଗ୍ରହଣ କରେ"]
            },
            answer: 1
        },
        {
            id: 2,
            subject: "Child Development & Pedagogy",
            q: { en: "Read the following statements and identify the correct one: [I] 'Cognitive development is independent of language'- Piaget, [II] 'Language is essential for cognitive development' - Vygotsky", or: "ନିମ୍ନ ବକ୍ତବ୍ୟ ଗୁଡିକୁ ପଢି ଠିକ ଉତ୍ତର ବାଛ: [I] ପିଆଜେ [II] ଭାଇଗୋଟସ୍କି" },
            options: {
                en: ["[I] correct and [II] wrong", "[I] wrong and [II] correct", "Both [I] and [II] correct", "Both [I] and [II] wrong"],
                or: ["[I] ଠିକ ଓ [II] ଭୁଲ", "[I] ଭୁଲ ଓ [II] ଠିକ", "ଉଭୟ [I] ଓ [II] ଠିକ", "ଉଭୟ [I] ଓ [II] ଭୁଲ"]
            },
            answer: 2
        },
        {
            id: 3,
            subject: "Mathematics",
            q: { en: "Manipulative tools for learners at the primary level are important to:", or: "ପ୍ରାଥମିକ ସ୍ତରରେ ଶିକ୍ଷାର୍ଥୀମାନଙ୍କ ପାଇଁ ବ୍ୟବହାରିକ ଉପକରଣ ଗୁଡ଼ିକ କାହିଁକି ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ?" },
            options: {
                en: ["speed up mental computation", "score high marks", "understand basic mathematical concepts", "memorize tables"],
                or: ["ମାନସିକ ଗଣନା ତ୍ୱରାନ୍ୱିତ କରିବା", "ଅଧିକ ନମ୍ବର ରଖିବା", "ମୌଳିକ ଗାଣିତିକ ଧାରଣା ବୁଝିବା", "ପଣିକିଆ ଘୋଷିବା"]
            },
            answer: 2
        },
        {
            id: 4,
            subject: "Environmental Studies (EVS)",
            q: { en: "The unit of Force in SI system is:", or: "SI ପଦ୍ଧତିରେ ବଳର ଏକକ କ'ଣ ?" },
            options: {
                en: ["Joule", "Watt", "Newton", "Pascal"],
                or: ["ଜୁଲ୍", "ୱାଟ୍", "ନ୍ୟୁଟନ୍", "ପାସ୍କାଲ୍"]
            },
            answer: 2
        },
        {
            id: 5,
            subject: "Language I (Odia)",
            q: { en: "ଭାଷା ଶିଖିବାର ପ୍ରକ୍ରିୟା ହେଉଛି ______ ।", or: "ଭାଷା ଶିଖିବାର ପ୍ରକ୍ରିୟା ହେଉଛି ______ ।" },
            options: {
                en: ["ଆକସ୍ମିକ", "ଜଟିଳ", "କ୍ରମଶଃ", "ସୀମିତ"],
                or: ["ଆକସ୍ମିକ", "ଜଟିଳ", "କ୍ରମଶଃ", "ସୀମିତ"]
            },
            answer: 2
        }
    ];
}

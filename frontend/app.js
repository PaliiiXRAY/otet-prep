// ============================================================================
// OTET Exam System - Modern Client Application
// ============================================================================

const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:8080/api/v1';

// App State
let isBackendOnline = false;
let currentPaperCode = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // { [qId]: optionIndex }
let markedForReview = new Set();
let visitedQuestions = new Set();
let timerInterval = null;
let timeLeft = 150 * 60; // 2.5 hours in seconds
let currentLang = 'en'; // 'en' or 'or'
let lastSubmissionResult = null;

// DOM Elements
const views = {
    landing: document.getElementById('landing-view'),
    quiz: document.getElementById('quiz-view'),
    result: document.getElementById('result-view')
};

const serverStatusPill = document.getElementById('server-status-pill');
const serverStatusText = document.getElementById('server-status-text');
const timerDisplay = document.getElementById('timer');
const qText = document.getElementById('q-text');
const optionsContainer = document.getElementById('options-container');
const qNumber = document.getElementById('q-number');
const totalQ = document.getElementById('total-q');
const currentSubject = document.getElementById('current-subject');
const paletteGrid = document.getElementById('palette-grid');

// Buttons
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnSubmit = document.getElementById('btn-submit');
const btnMark = document.getElementById('btn-mark');
const btnClear = document.getElementById('btn-clear');
const btnLang = document.getElementById('lang-toggle');
const btnReviewToggle = document.getElementById('btn-review-toggle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkBackendHealth();
});

function setupEventListeners() {
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

    // Event delegation for paper cards
    document.getElementById('papers-container').addEventListener('click', (e) => {
        const startBtn = e.target.closest('.start-btn') || e.target.closest('.paper-card');
        if (startBtn) {
            const paperCode = startBtn.getAttribute('data-paper');
            if (paperCode) startQuiz(paperCode);
        }
    });
}

// ----------------------------------------------------------------------------
// Backend Connectivity & Health Check
// ----------------------------------------------------------------------------
async function checkBackendHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
        if (res.ok) {
            const data = await res.json();
            isBackendOnline = true;
            serverStatusPill.className = 'server-status online';
            serverStatusText.textContent = 'Backend: Spring Boot (Online)';
            loadAvailablePapers();
            return;
        }
    } catch (e) {
        // Backend not currently reachable
    }

    isBackendOnline = false;
    serverStatusPill.className = 'server-status offline';
    serverStatusText.textContent = 'Local Standalone Mode';
}

async function loadAvailablePapers() {
    try {
        const res = await fetch(`${API_BASE}/tests`);
        if (!res.ok) return;
        const papers = await res.json();
        if (papers && papers.length > 0) {
            const container = document.getElementById('papers-container');
            container.innerHTML = '';
            papers.forEach(p => {
                const card = document.createElement('div');
                card.className = 'paper-card';
                card.setAttribute('data-paper', p.paperCode);

                const tag = document.createElement('div');
                tag.className = 'tag';
                tag.textContent = p.targetClass || 'Teacher Eligibility';

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
    } catch (err) {
        console.warn('Could not fetch papers list from backend:', err);
    }
}

// ----------------------------------------------------------------------------
// Quiz Lifecycle
// ----------------------------------------------------------------------------
async function startQuiz(paperCode) {
    currentPaperCode = paperCode;
    serverStatusText.textContent = 'Loading Questions...';

    try {
        let questions = null;

        if (isBackendOnline) {
            const res = await fetch(`${API_BASE}/tests/${paperCode}/questions`);
            if (res.ok) {
                questions = await res.json();
            }
        }

        // Fallback for standalone preview if backend isn't running yet
        if (!questions || questions.length === 0) {
            questions = getMockQuestionsFallback(paperCode);
        }

        if (!questions || questions.length === 0) {
            alert('No questions found for this test paper!');
            return;
        }

        currentQuestions = questions;
        userAnswers = {};
        markedForReview.clear();
        visitedQuestions.clear();
        visitedQuestions.add(0);
        currentQuestionIndex = 0;

        switchView('quiz');
        timerDisplay.style.display = 'block';
        totalQ.textContent = currentQuestions.length;
        renderPalette();
        loadQuestion(0);
        startTimer();
    } catch (err) {
        console.error('Error starting quiz:', err);
        alert('Could not start test: ' + err.message);
    }
}

function switchView(viewName) {
    Object.values(views).forEach(el => el.style.display = 'none');
    views[viewName].style.display = 'block';
    if (viewName === 'quiz') views[viewName].style.display = 'grid';
    if (viewName === 'landing') timerDisplay.style.display = 'none';
}

function loadQuestion(index) {
    if (index < 0 || index >= currentQuestions.length) return;

    currentQuestionIndex = index;
    const q = currentQuestions[index];

    visitedQuestions.add(index);
    updatePaletteStatus(index);

    // Subject tag styling
    currentSubject.textContent = q.subject || 'General';
    const subjColors = {
        'CDP': '#ffedd5',
        'Odia': '#fae8ff',
        'English': '#e0e7ff',
        'Math': '#dcfce7',
        'Science': '#dbeafe',
        'Social Studies': '#fef3c7'
    };
    currentSubject.style.background = subjColors[q.subject] || '#f1f5f9';

    qNumber.textContent = index + 1;

    // Set Question text safely
    const questionText = (q.q && q.q[currentLang]) ? q.q[currentLang] : (q.q && q.q['en'] ? q.q['en'] : 'Question text');
    qText.textContent = questionText;

    // Render Options safely
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

    // Update Mark for Review button state
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
}

function clearCurrentAnswer() {
    const q = currentQuestions[currentQuestionIndex];
    if (q && userAnswers[q.id] !== undefined) {
        delete userAnswers[q.id];
        updatePaletteStatus(currentQuestionIndex);
        loadQuestion(currentQuestionIndex);
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
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'or' : 'en';
    btnLang.textContent = currentLang === 'en' ? 'Switch to ଓଡ଼ିଆ' : 'Switch to English';
    if (views.quiz.style.display !== 'none') {
        loadQuestion(currentQuestionIndex);
    }
}

// ----------------------------------------------------------------------------
// Timer
// ----------------------------------------------------------------------------
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 150 * 60;
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
// Submission & Results
// ----------------------------------------------------------------------------
async function submitExam() {
    clearInterval(timerInterval);
    switchView('result');

    const candidateName = document.getElementById('candidate-name').value.trim() || 'Candidate';
    const candidateEmail = document.getElementById('candidate-email').value.trim() || 'student@otet.edu';

    let result = null;

    if (isBackendOnline) {
        try {
            const payload = {
                candidateName,
                candidateEmail,
                answers: userAnswers
            };
            const res = await fetch(`${API_BASE}/tests/${currentPaperCode}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                result = await res.json();
            }
        } catch (err) {
            console.warn('Backend submission failed, evaluating locally:', err);
        }
    }

    // Local evaluation fallback if backend offline
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
    });

    const pct = currentQuestions.length ? (score / currentQuestions.length) * 100 : 0;
    return {
        score,
        totalQuestions: currentQuestions.length,
        correctCount: correct,
        wrongCount: wrong,
        skippedCount: skipped,
        percentage: Math.round(pct * 10) / 10,
        passed: pct >= 60,
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
// Mock Fallback Questions (Ensures app works anytime even during file preview)
// ----------------------------------------------------------------------------
function getMockQuestionsFallback(paperCode) {
    return [
        {
            id: 1,
            subject: "CDP",
            q: { en: "Which is not a tool of observation in classroom assessment?", or: "ନିମ୍ନୋକ୍ତ ମଧ୍ୟରୁ କେଉଁଟି ନିରୀକ୍ଷଣର ଏକ ଉପକରଣ ନୁହେଁ ?" },
            options: {
                en: ["Achievement test", "Rating scale", "Check-list", "Anecdotal record"],
                or: ["ପ୍ରାପ୍ତି ପରୀକ୍ଷଣ", "ମୂଲ୍ୟାଙ୍କନ ମାନଦଣ୍ଡ", "ଯାଞ୍ଚ ତାଲିକା", "ଘଟଣାବଳୀ ଲିପି"]
            },
            answer: 0
        },
        {
            id: 2,
            subject: "CDP",
            q: { en: "If a test gives the same results whenever it is repeated, it is called:", or: "ଯଦି ଏକ ପରୀକ୍ଷା ବାରମ୍ବାର କଲେ ସମାନ ଫଳାଫଳ ଦିଏ, ତାହାକୁ କ'ଣ କୁହାଯାଏ ?" },
            options: {
                en: ["Validity", "Usability", "Reliability", "Predictability"],
                or: ["ବୈଧତା", "ଉପଯୋଗୀତା", "ବିଶ୍ୱସନୀୟତା", "ପୂର୍ବାନୁମାନ"]
            },
            answer: 2
        },
        {
            id: 3,
            subject: "CDP",
            q: { en: "Dyscalculia is related to difficulty in:", or: "ଡିସକାଲକୁଲିଆ କେଉଁ ଅସୁବିଧା ସହିତ ଜଡିତ ?" },
            options: {
                en: ["Reading", "Writing", "Mathematics calculation", "Speaking"],
                or: ["ପଠନ", "ଲେଖନ", "ଗାଣିତିକ ଗଣନା", "କଥନ"]
            },
            answer: 2
        },
        {
            id: 4,
            subject: "Science",
            q: { en: "The SI unit of Force is:", or: "ବଳର SI ଏକକ କ'ଣ ?" },
            options: {
                en: ["Joule", "Watt", "Newton", "Pascal"],
                or: ["ଜୁଲ୍", "ୱାଟ୍", "ନ୍ୟୁଟନ୍", "ପାସ୍କାଲ୍"]
            },
            answer: 2
        },
        {
            id: 5,
            subject: "Math",
            q: { en: "If a² - b² = 24 and a - b = 2, find the value of a + b:", or: "ଯଦି a² - b² = 24 ଏବଂ a - b = 2 ହୁଏ, ତେବେ a + b ର ମୂଲ୍ୟ କେତେ ?" },
            options: {
                en: ["10", "12", "14", "22"],
                or: ["10", "12", "14", "22"]
            },
            answer: 1
        }
    ];
}

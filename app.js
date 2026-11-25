// State
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // { qId: optionIndex }
let visitedQuestions = new Set();
let timerInterval;
let timeLeft = 150 * 60; // 2.5 hours in seconds
let currentLang = 'en'; // 'en' or 'or'

// DOM Elements
const views = {
    landing: document.getElementById('landing-view'),
    quiz: document.getElementById('quiz-view'),
    result: document.getElementById('result-view')
};

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
const btnLang = document.getElementById('lang-toggle');
const btnShowAnswer = document.getElementById('btn-show-answer');

// Event Listeners
btnPrev.addEventListener('click', () => navigate(-1));
btnNext.addEventListener('click', () => navigate(1));
btnSubmit.addEventListener('click', submitQuiz);
btnLang.addEventListener('click', toggleLanguage);
btnMark.addEventListener('click', markReview);
btnShowAnswer.addEventListener('click', showAnswer);

// Functions

function startQuiz(paperType) {
    // 1. Load Questions based on Global Variables from script tags
    if (paperType === 'paper1') {
        currentQuestions = window.paper1Questions || [];
    } else if (paperType === 'paper2-social') {
        currentQuestions = window.paper2SocialQuestions || [];
    } else if (paperType === 'paper2-science') {
        currentQuestions = window.paper2ScienceQuestions || [];
    } else {
        alert('Unknown paper type');
        return;
    }

    if (currentQuestions.length === 0) {
        alert('No questions loaded for this paper!');
        return;
    }

    userAnswers = {};
    visitedQuestions.clear();
    visitedQuestions.add(0);
    currentQuestionIndex = 0;

    // 2. Setup UI
    switchView('quiz');
    timerDisplay.style.display = 'block';
    totalQ.textContent = currentQuestions.length;
    renderPalette();
    loadQuestion(0);

    // 3. Start Timer
    startTimer();
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

    currentSubject.textContent = q.subject;
    if (q.subject === 'Odia') currentSubject.style.background = '#ffedd5';
    else if (q.subject === 'English') currentSubject.style.background = '#fae8ff';
    else if (q.subject === 'Math') currentSubject.style.background = '#dcfce7';
    else if (q.subject === 'Science') currentSubject.style.background = '#dbeafe';
    else currentSubject.style.background = '#e0f2fe';

    qNumber.textContent = index + 1;
    qText.textContent = q.q[currentLang];

    optionsContainer.innerHTML = '';
    const opts = q.options[currentLang];

    opts.forEach((optText, optIndex) => {
        const div = document.createElement('div');
        div.className = `option-item ${userAnswers[q.id] === optIndex ? 'selected' : ''}`;
        div.innerHTML = `
            <div class="circle"></div>
            <span>${optText}</span>
        `;
        div.onclick = () => selectOption(q.id, optIndex);
        optionsContainer.appendChild(div);
    });

    btnPrev.disabled = index === 0;
    btnNext.textContent = index === currentQuestions.length - 1 ? 'Finish' : 'Next';
}

function selectOption(qId, optIndex) {
    userAnswers[qId] = optIndex;
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

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 150 * 60;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    timerDisplay.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function renderPalette() {
    paletteGrid.innerHTML = '';
    currentQuestions.forEach((q, i) => {
        const btn = document.createElement('button');
        btn.textContent = i + 1;
        btn.id = `palette-${i}`;
        btn.onclick = () => loadQuestion(i);
        paletteGrid.appendChild(btn);
    });
}

function updatePaletteStatus(index) {
    const btn = document.getElementById(`palette-${index}`);
    if (!btn) return;

    const qId = currentQuestions[index].id;
    let cls = '';
    if (index === currentQuestionIndex) cls += ' active';
    if (userAnswers[qId] !== undefined) {
        cls += ' answered';
    } else if (visitedQuestions.has(index)) {
        cls += ' visited';
    }
    btn.className = cls;

    Array.from(paletteGrid.children).forEach((b, i) => {
        if (i !== index) b.classList.remove('active');
    });
}

function showAnswer() {
    if (currentQuestions.length === 0) return;

    const q = currentQuestions[currentQuestionIndex];
    const correctAnswer = q.answer;
    const correctOption = q.options[currentLang][correctAnswer];

    // Highlight the correct answer
    const optionDivs = document.querySelectorAll('.option-item');
    optionDivs.forEach((div, index) => {
        if (index === correctAnswer) {
            div.style.background = '#dcfce7';
            div.style.borderColor = 'var(--success)';
            div.style.borderWidth = '2px';
        }
    });

    // Show explanation alert
    alert(`✅ Correct Answer: ${correctOption}\n\nOption ${correctAnswer + 1} is the right answer for this question.`);

    // Reset highlighting after 3 seconds
    setTimeout(() => {
        loadQuestion(currentQuestionIndex);
    }, 3000);
}

function markReview() {
    alert("Question Marked for Review!");
}

function submitQuiz() {
    clearInterval(timerInterval);

    let score = 0;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let subjectStats = {};

    currentQuestions.forEach(q => {
        if (!subjectStats[q.subject]) {
            subjectStats[q.subject] = { total: 0, correct: 0 };
        }
        subjectStats[q.subject].total++;

        if (userAnswers[q.id] === undefined) {
            skipped++;
        } else if (userAnswers[q.id] === q.answer) {
            score++;
            correct++;
            subjectStats[q.subject].correct++;
        } else {
            wrong++;
        }
    });

    switchView('result');
    document.getElementById('score-display').textContent = score;
    document.getElementById('stat-correct').textContent = correct;
    document.getElementById('stat-wrong').textContent = wrong;
    document.getElementById('stat-skip').textContent = skipped;

    const percent = (score / currentQuestions.length) * 100;
    const msg = document.getElementById('score-msg');

    if (percent >= 60) {
        msg.textContent = "🎉 Congratulations! You Passed (OTET Qualified)";
        msg.style.color = "var(--success)";
    } else {
        msg.textContent = `Good Attempt! You scored ${percent.toFixed(1)}%. Keep practicing to reach 60%.`;
        msg.style.color = "var(--text-main)";
    }

    const statsGrid = document.querySelector('.stats-grid');
    while (statsGrid.children.length > 3) {
        statsGrid.removeChild(statsGrid.lastChild);
    }

    const breakdownDiv = document.createElement('div');
    breakdownDiv.style.gridColumn = "1 / -1";
    breakdownDiv.style.marginTop = "1rem";
    breakdownDiv.style.textAlign = "left";
    breakdownDiv.innerHTML = "<h3>Subject-wise Performance</h3>";

    Object.keys(subjectStats).forEach(subj => {
        const s = subjectStats[subj];
        const p = Math.round((s.correct / s.total) * 100);
        const barColor = p >= 60 ? 'var(--success)' : (p >= 40 ? 'var(--warning)' : 'var(--danger)');

        breakdownDiv.innerHTML += `
            <div style="margin-top: 0.5rem">
                <div style="display:flex; justify-content:space-between">
                    <strong>${subj}</strong>
                    <span>${s.correct}/${s.total} (${p}%)</span>
                </div>
                <div style="background:#e2e8f0; height:8px; border-radius:4px; margin-top:2px;">
                    <div style="background:${barColor}; width:${p}%; height:100%; border-radius:4px;"></div>
                </div>
            </div>
        `;
    });
    statsGrid.appendChild(breakdownDiv);
}

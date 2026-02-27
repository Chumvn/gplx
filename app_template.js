/* ===== GPLX 2026 - Core Application ===== */
(function () {
    'use strict';

    /* ---------- DATA (injected by build) ---------- */
    /*QUESTIONS_DATA_PLACEHOLDER*/

    /* ---------- CHAPTERS ---------- */
    const CHAPTERS = [
        { id: 'diem-liet', name: 'Câu hỏi điểm liệt', icon: '🔥', from: 0, to: 0, filter: q => q.dl },
        { id: 'c1', name: 'Khái niệm và quy tắc', icon: '🚦', from: 1, to: 180 },
        { id: 'c2', name: 'Văn hóa giao thông', icon: '🌐', from: 181, to: 205 },
        { id: 'c3', name: 'Kỹ thuật lái xe', icon: '🔧', from: 206, to: 263 },
        { id: 'c4', name: 'Cấu tạo sửa chữa', icon: '⚙️', from: 264, to: 300 },
        { id: 'c5', name: 'Biển báo đường bộ', icon: '🚧', from: 301, to: 485 },
        { id: 'c6', name: 'Sa hình tình huống', icon: '⚠️', from: 486, to: 600 }
    ];

    const EXAMS = {
        A1: { name: 'A1', total: 25, time: 19, pass: 21, desc: 'Mô tô ≤ 125cc' },
        A: { name: 'A', total: 25, time: 19, pass: 21, desc: 'Mô tô > 125cc' },
        B: { name: 'B', total: 30, time: 20, pass: 27, desc: 'Ô tô con, xe ≤ 9 chỗ' },
        C1: { name: 'C1', total: 35, time: 22, pass: 32, desc: 'Xe tải 3.5t – 7.5t' },
        C: { name: 'C', total: 40, time: 24, pass: 36, desc: 'Xe tải > 7.5t' },
        D1: { name: 'D1', total: 40, time: 24, pass: 36, desc: 'Chở người 9–16 chỗ' },
        D2: { name: 'D2', total: 40, time: 24, pass: 36, desc: 'Chở người 17–29 chỗ' },
        D: { name: 'D', total: 45, time: 26, pass: 41, desc: 'Chở người > 29 chỗ' },
        BE: { name: 'BE', total: 35, time: 22, pass: 32, desc: 'B kéo rơ moóc > 750kg' },
        CE: { name: 'CE', total: 40, time: 24, pass: 36, desc: 'C kéo rơ moóc > 750kg' },
        DE: { name: 'DE', total: 45, time: 26, pass: 41, desc: 'D kéo rơ moóc, xe nối toa' }
    };

    /* ---------- STATE ---------- */
    let state = {
        mode: 'dashboard', // dashboard | practice | exam | result
        questions: [],     // current question list
        currentIdx: 0,
        answers: {},       // { qId: selectedIndex }
        examType: null,
        examTimer: null,
        examTimeLeft: 0,
        reviewMode: false
    };

    /* ---------- STORAGE ---------- */
    const STORE_KEY = 'gplx2026';
    function loadStore() {
        try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
    }
    function saveStore(data) {
        localStorage.setItem(STORE_KEY, JSON.stringify(data));
    }
    function getProgress() {
        const s = loadStore();
        return s.progress || {};
    }
    function saveProgress(qId, isCorrect) {
        const s = loadStore();
        if (!s.progress) s.progress = {};
        s.progress[qId] = isCorrect ? 1 : 0;
        saveStore(s);
    }
    function getBookmarks() {
        const s = loadStore();
        return s.bookmarks || [];
    }
    function toggleBookmarkStore(qId) {
        const s = loadStore();
        if (!s.bookmarks) s.bookmarks = [];
        const idx = s.bookmarks.indexOf(qId);
        if (idx >= 0) s.bookmarks.splice(idx, 1);
        else s.bookmarks.push(qId);
        saveStore(s);
        return s.bookmarks.includes(qId);
    }

    /* ---------- THEME ---------- */
    function initTheme() {
        const saved = localStorage.getItem('gplx-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        updateThemeIcon(saved);
    }
    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('gplx-theme', next);
        updateThemeIcon(next);
    }
    function updateThemeIcon(theme) {
        const btn = document.getElementById('themeToggle');
        if (btn) btn.querySelector('.theme-icon').textContent = theme === 'dark' ? '🌙' : '☀️';
    }

    /* ---------- VIEWS ---------- */
    function showView(id) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
        window.scrollTo(0, 0);
    }

    /* ---------- DASHBOARD ---------- */
    function renderDashboard() {
        const progress = getProgress();
        const total = Object.keys(progress).length;
        const correct = Object.values(progress).filter(v => v === 1).length;
        const wrong = total - correct;
        const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

        document.getElementById('statTotal').textContent = total;
        document.getElementById('statCorrect').textContent = correct;
        document.getElementById('statWrong').textContent = wrong;
        document.getElementById('statPercent').textContent = pct + '%';
        document.getElementById('progressBar').style.width = Math.round((total / QUESTIONS.length) * 100) + '%';
        document.getElementById('progressText').textContent = total + '/' + QUESTIONS.length + ' câu hỏi';

        renderTopics();
    }

    function renderTopics() {
        const grid = document.getElementById('topicsGrid');
        const progress = getProgress();
        grid.innerHTML = '';

        CHAPTERS.forEach(ch => {
            const qs = ch.filter ? QUESTIONS.filter(ch.filter) : QUESTIONS.filter(q => q.ch === ch.id);
            const done = qs.filter(q => progress[q.id] !== undefined).length;
            const correct = qs.filter(q => progress[q.id] === 1).length;
            const pct = qs.length > 0 ? Math.round((done / qs.length) * 100) : 0;

            const btn = document.createElement('button');
            btn.className = 'topic-card' + (ch.id === 'diem-liet' ? ' diem-liet' : '');
            btn.onclick = () => App.startPractice(ch.id);
            btn.innerHTML = `
      <span class="topic-icon">${ch.icon}</span>
      <div class="topic-info">
        <div class="topic-name">${ch.name}</div>
        <div class="topic-count">${done}/${qs.length} câu hỏi${correct > 0 ? ' • ' + correct + ' đúng' : ''}</div>
        <div class="topic-progress-mini"><div class="topic-progress-fill" style="width:${pct}%"></div></div>
      </div>
      <span class="topic-arrow">›</span>
    `;
            grid.appendChild(btn);
        });
    }

    /* ---------- PRACTICE ---------- */
    function startPractice(topicId) {
        let qs;
        if (topicId === 'all') {
            qs = [...QUESTIONS];
        } else if (topicId === 'diem-liet') {
            qs = QUESTIONS.filter(q => q.dl);
        } else if (topicId === 'bookmarks') {
            const bm = getBookmarks();
            qs = QUESTIONS.filter(q => bm.includes(q.id));
            if (qs.length === 0) { alert('Chưa có câu nào được đánh dấu!'); return; }
        } else if (topicId === 'wrong') {
            const progress = getProgress();
            qs = QUESTIONS.filter(q => progress[q.id] === 0);
            if (qs.length === 0) { alert('Chưa có câu trả lời sai!'); return; }
        } else {
            qs = QUESTIONS.filter(q => q.ch === topicId);
        }

        state.mode = 'practice';
        state.questions = qs;
        state.currentIdx = 0;
        state.answers = {};
        state.examType = null;
        state.reviewMode = false;
        clearTimer();

        showView('viewQuestion');
        document.getElementById('qTimer').classList.add('hidden');
        document.getElementById('gridToggleBtn').classList.add('hidden');
        renderQuestion();
    }

    /* ---------- EXAM ---------- */
    function startExam(type) {
        const cfg = EXAMS[type];
        if (!cfg) return;

        // Select random questions ensuring diem liet coverage
        const dlQs = shuffle(QUESTIONS.filter(q => q.dl)).slice(0, Math.min(8, cfg.total));
        const otherQs = shuffle(QUESTIONS.filter(q => !q.dl && !dlQs.find(d => d.id === q.id)));
        const remaining = cfg.total - dlQs.length;
        const selected = shuffle([...dlQs, ...otherQs.slice(0, remaining)]);

        state.mode = 'exam';
        state.questions = selected;
        state.currentIdx = 0;
        state.answers = {};
        state.examType = type;
        state.examTimeLeft = cfg.time * 60;
        state.reviewMode = false;

        showView('viewQuestion');
        document.getElementById('qTimer').classList.remove('hidden');
        document.getElementById('gridToggleBtn').classList.remove('hidden');
        document.getElementById('btnCheck').classList.add('hidden');
        startTimer();
        renderQuestion();
    }

    function startTimer() {
        clearTimer();
        updateTimerDisplay();
        state.examTimer = setInterval(() => {
            state.examTimeLeft--;
            updateTimerDisplay();
            if (state.examTimeLeft <= 0) {
                clearTimer();
                submitExam();
            }
        }, 1000);
    }

    function clearTimer() {
        if (state.examTimer) {
            clearInterval(state.examTimer);
            state.examTimer = null;
        }
    }

    function updateTimerDisplay() {
        const el = document.getElementById('qTimer');
        const m = Math.floor(state.examTimeLeft / 60);
        const s = state.examTimeLeft % 60;
        el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
        el.classList.toggle('warn', state.examTimeLeft <= 60);
    }

    /* ---------- RENDER QUESTION ---------- */
    function renderQuestion() {
        const q = state.questions[state.currentIdx];
        if (!q) return;

        const ch = CHAPTERS.find(c => c.id === q.ch) || CHAPTERS.find(c => c.id === 'diem-liet');
        const bookmarks = getBookmarks();

        // Counter
        document.getElementById('qCounter').textContent = (state.currentIdx + 1) + '/' + state.questions.length;

        // Progress
        document.getElementById('qProgressBar').style.width =
            Math.round(((state.currentIdx + 1) / state.questions.length) * 100) + '%';

        // Chapter badge  
        const chBadge = document.getElementById('qChapterBadge');
        chBadge.textContent = (ch ? ch.icon + ' ' + ch.name : '') + ' • Câu ' + q.id;

        // Diem liet badge
        const dlBadge = document.getElementById('qDiemLietBadge');
        dlBadge.classList.toggle('hidden', !q.dl);

        // Question text
        document.getElementById('qText').textContent = 'Câu ' + q.id + '. ' + q.t;

        // Question images
        const imgContainer = document.getElementById('qImages');
        if (imgContainer) {
            imgContainer.innerHTML = '';
            if (q.img && q.img.length > 0) {
                imgContainer.classList.remove('hidden');
                q.img.forEach(function (src) {
                    const img = document.createElement('img');
                    img.src = './assets/images/' + src;
                    img.alt = 'Hình minh họa câu ' + q.id;
                    img.className = 'q-image';
                    img.loading = 'lazy';
                    imgContainer.appendChild(img);
                });
            } else {
                imgContainer.classList.add('hidden');
            }
        }

        // Bookmark
        const bmBtn = document.getElementById('qBookmark');
        bmBtn.classList.toggle('active', bookmarks.includes(q.id));
        bmBtn.textContent = bookmarks.includes(q.id) ? '★' : '☆';

        // Options
        const optContainer = document.getElementById('qOptions');
        optContainer.innerHTML = '';
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const answered = state.answers[q.id] !== undefined;
        const selectedIdx = state.answers[q.id];

        q.o.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'q-option';

            if (state.mode === 'practice' && answered) {
                if (i === q.c) btn.classList.add('correct');
                if (i === selectedIdx && i !== q.c) btn.classList.add('wrong');
                btn.classList.add('disabled');
            } else if (state.reviewMode && answered) {
                if (i === q.c) btn.classList.add('correct');
                if (i === selectedIdx && i !== q.c) btn.classList.add('wrong');
                btn.classList.add('disabled');
            } else if (i === selectedIdx) {
                btn.classList.add('selected');
            }

            btn.innerHTML = `<span class="option-letter">${letters[i] || (i + 1)}</span><span>${opt}</span>`;

            if (!answered || (state.mode === 'exam' && !state.reviewMode)) {
                btn.onclick = () => selectOption(i);
            }
            optContainer.appendChild(btn);
        });

        // Explain
        const explainEl = document.getElementById('qExplain');
        const explainText = document.getElementById('qExplainText');
        if (state.mode === 'practice' && answered) {
            explainEl.classList.remove('hidden');
            const isCorrect = selectedIdx === q.c;
            document.querySelector('.explain-icon').textContent = isCorrect ? '✅' : '❌';
            explainText.textContent = isCorrect
                ? 'Chính xác! Đáp án đúng là ' + letters[q.c] + '.'
                : 'Sai rồi! Đáp án đúng là ' + letters[q.c] + '. ' + q.o[q.c];
        } else if (state.reviewMode && answered) {
            explainEl.classList.remove('hidden');
            const isCorrect = selectedIdx === q.c;
            document.querySelector('.explain-icon').textContent = isCorrect ? '✅' : '❌';
            explainText.textContent = isCorrect
                ? 'Đáp án đúng: ' + letters[q.c]
                : 'Bạn chọn ' + letters[selectedIdx] + '. Đáp án đúng: ' + letters[q.c];
        } else {
            explainEl.classList.add('hidden');
        }

        // Nav buttons
        document.getElementById('btnPrev').disabled = state.currentIdx === 0;

        if (state.mode === 'practice') {
            document.getElementById('btnCheck').classList.toggle('hidden', answered);
            document.getElementById('btnNext').textContent =
                state.currentIdx === state.questions.length - 1 ? 'Hoàn thành' : 'Tiếp →';
        } else if (state.mode === 'exam' && !state.reviewMode) {
            document.getElementById('btnCheck').classList.add('hidden');
            document.getElementById('btnNext').textContent =
                state.currentIdx === state.questions.length - 1 ? 'Nộp bài' : 'Tiếp →';
        } else {
            document.getElementById('btnCheck').classList.add('hidden');
            document.getElementById('btnNext').textContent =
                state.currentIdx === state.questions.length - 1 ? 'Về trang chính' : 'Tiếp →';
        }
    }

    function selectOption(idx) {
        const q = state.questions[state.currentIdx];
        if (!q) return;

        if (state.mode === 'practice') {
            state.answers[q.id] = idx;
            const isCorrect = idx === q.c;
            saveProgress(q.id, isCorrect);
            renderQuestion();
        } else if (state.mode === 'exam' && !state.reviewMode) {
            state.answers[q.id] = idx;
            renderQuestion();
        }
    }

    function checkAnswer() {
        const q = state.questions[state.currentIdx];
        if (!q || state.answers[q.id] !== undefined) return;
        // In practice mode, this shows the correct answer without selecting
        // Actually user must select first
        alert('Vui lòng chọn một đáp án trước!');
    }

    function nextQuestion() {
        if (state.currentIdx < state.questions.length - 1) {
            state.currentIdx++;
            renderQuestion();
            window.scrollTo(0, 0);
        } else {
            if (state.mode === 'exam' && !state.reviewMode) {
                submitExam();
            } else if (state.reviewMode) {
                goHome();
            } else {
                goHome();
            }
        }
    }

    function prevQuestion() {
        if (state.currentIdx > 0) {
            state.currentIdx--;
            renderQuestion();
            window.scrollTo(0, 0);
        }
    }

    /* ---------- EXAM SUBMIT ---------- */
    function submitExam() {
        clearTimer();
        const cfg = EXAMS[state.examType];
        if (!cfg) { goHome(); return; }

        let correct = 0;
        let wrong = 0;
        let unanswered = 0;
        let failedDiemLiet = false;

        state.questions.forEach(q => {
            const ans = state.answers[q.id];
            if (ans === undefined) {
                unanswered++;
                if (q.dl) failedDiemLiet = true;
            } else if (ans === q.c) {
                correct++;
                saveProgress(q.id, true);
            } else {
                wrong++;
                saveProgress(q.id, false);
                if (q.dl) failedDiemLiet = true;
            }
        });

        const passed = correct >= cfg.pass && !failedDiemLiet;
        state.mode = 'result';

        showView('viewResult');
        document.getElementById('resultIcon').textContent = passed ? '🎉' : '😞';
        document.getElementById('resultTitle').textContent = passed ? 'ĐẠT' : 'KHÔNG ĐẠT';
        document.getElementById('resultScore').textContent = correct + '/' + cfg.total;
        document.getElementById('resultScore').style.color = passed ? 'var(--success)' : 'var(--danger)';

        const details = document.getElementById('resultDetails');
        details.innerHTML = `
    <div class="result-detail-item"><span>✅ Trả lời đúng</span><span>${correct}</span></div>
    <div class="result-detail-item"><span>❌ Trả lời sai</span><span>${wrong}</span></div>
    <div class="result-detail-item"><span>⏭️ Chưa trả lời</span><span>${unanswered}</span></div>
    <div class="result-detail-item"><span>📊 Yêu cầu đạt</span><span>${cfg.pass}/${cfg.total}</span></div>
    ${failedDiemLiet ? '<div class="result-detail-item" style="color:var(--danger)"><span>🔥 Sai câu điểm liệt</span><span>TRƯỢT</span></div>' : ''}
  `;
    }

    function reviewExam() {
        state.reviewMode = true;
        state.currentIdx = 0;
        showView('viewQuestion');
        document.getElementById('qTimer').classList.add('hidden');
        document.getElementById('gridToggleBtn').classList.remove('hidden');
        renderQuestion();
    }

    /* ---------- BOOKMARKS ---------- */
    function toggleBookmark() {
        const q = state.questions[state.currentIdx];
        if (!q) return;
        toggleBookmarkStore(q.id);
        renderQuestion();
    }

    /* ---------- QUESTION GRID ---------- */
    function toggleGrid() {
        const overlay = document.getElementById('qGridOverlay');
        overlay.classList.toggle('hidden');
        if (!overlay.classList.contains('hidden')) {
            renderGrid();
        }
    }

    function renderGrid() {
        const grid = document.getElementById('qGrid');
        grid.innerHTML = '';
        state.questions.forEach((q, i) => {
            const btn = document.createElement('button');
            btn.className = 'q-grid-item';
            btn.textContent = q.id;
            if (state.answers[q.id] !== undefined) {
                if (state.reviewMode) {
                    btn.classList.add(state.answers[q.id] === q.c ? 'answered' : 'wrong-answer');
                } else {
                    btn.classList.add('answered');
                }
            }
            if (i === state.currentIdx) btn.classList.add('current');
            if (q.dl) btn.classList.add('diem-liet-dot');
            btn.onclick = () => { state.currentIdx = i; toggleGrid(); renderQuestion(); };
            grid.appendChild(btn);
        });
    }

    /* ---------- NAV ---------- */
    function goHome() {
        clearTimer();
        state.mode = 'dashboard';
        state.reviewMode = false;
        showView('viewDashboard');
        renderDashboard();
    }

    /* ---------- UTILS ---------- */
    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /* ---------- PWA ---------- */
    function registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(() => { });
        }
    }

    /* ---------- INIT ---------- */
    function init() {
        initTheme();
        document.getElementById('themeToggle').addEventListener('click', toggleTheme);
        renderDashboard();
        registerSW();
    }

    /* ---------- PUBLIC API ---------- */
    window.App = {
        startPractice,
        startExam,
        goHome,
        toggleBookmark,
        toggleGrid,
        submitExam,
        checkAnswer: checkAnswer,
        nextQuestion,
        prevQuestion,
        showBookmarks: () => startPractice('bookmarks'),
        showWrongAnswers: () => startPractice('wrong'),
        reviewExam
    };

    document.addEventListener('DOMContentLoaded', init);
})();

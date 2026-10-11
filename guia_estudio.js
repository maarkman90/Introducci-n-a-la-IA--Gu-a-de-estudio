// ===== Guía de Estudio Interactiva — Lógica =====
(function () {
    "use strict";

    const STORAGE_KEY = "guia_ia_modulo1_progress";

    // ---- State ----
    const state = loadState();

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return { explored: {}, checklist: {}, quizCorrect: {} };
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) { /* ignore */ }
    }

    // ---- Sections for nav dots & progress ----
    const sections = Array.from(document.querySelectorAll(".block-section"));
    const navDotsContainer = document.getElementById("navDots");
    const progressBar = document.getElementById("progressBar");
    const statExplored = document.getElementById("statExplored");
    const statTotal = document.getElementById("statTotal");
    const statQuiz = document.getElementById("statQuiz");
    const statChecklist = document.getElementById("statChecklist");

    statTotal.textContent = sections.length;

    // Build nav dots
    sections.forEach((sec, idx) => {
        const dot = document.createElement("div");
        dot.className = "nav-dot";
        dot.title = sec.querySelector("h2") ? sec.querySelector("h2").textContent : `Sección ${idx + 1}`;
        dot.addEventListener("click", () => {
            sec.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        navDotsContainer.appendChild(dot);
    });
    const navDots = Array.from(navDotsContainer.children);

    // ---- Intersection Observer: reveal + mark explored + active nav dot ----
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const idx = sections.indexOf(entry.target);
                if (entry.isIntersecting) {
                    entry.target.classList.add("in-view");
                    navDots.forEach((d) => d.classList.remove("active"));
                    if (navDots[idx]) navDots[idx].classList.add("active");

                    // mark explored after a short dwell time
                    if (!state.explored[entry.target.id]) {
                        state.explored[entry.target.id] = true;
                        navDots[idx] && navDots[idx].classList.add("done");
                        entry.target.classList.add("explored");
                        saveState();
                        updateStats();
                    }
                }
            });
        },
        { threshold: 0.35 }
    );

    sections.forEach((sec) => observer.observe(sec));

    // Restore explored visuals on load
    sections.forEach((sec, idx) => {
        if (state.explored[sec.id]) {
            sec.classList.add("explored", "in-view");
            navDots[idx] && navDots[idx].classList.add("done");
        }
    });

    // ---- Scroll progress bar ----
    function updateProgressBar() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = Math.min(100, Math.max(0, pct)) + "%";
    }
    window.addEventListener("scroll", updateProgressBar, { passive: true });
    updateProgressBar();

    // ---- Accordions ----
    document.querySelectorAll(".accordion").forEach((acc) => {
        const head = acc.querySelector(".accordion-head");
        head.addEventListener("click", () => {
            acc.classList.toggle("open");
        });
    });

    // ---- Flashcards ----
    document.querySelectorAll(".flashcard").forEach((card) => {
        card.addEventListener("click", () => {
            card.classList.toggle("flipped");
        });
    });

    // ---- Search term chips: open a Google search in new tab ----
    document.querySelectorAll(".search-term-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
            const query = chip.textContent.replace("🔎", "").trim();
            const url = "https://www.google.com/search?q=" + encodeURIComponent(query);
            window.open(url, "_blank", "noopener");
        });
    });

    // ---- Quiz ----
    document.querySelectorAll(".quiz-box").forEach((box, qIdx) => {
        const opts = Array.from(box.querySelectorAll(".quiz-opt"));
        const feedback = box.querySelector(".quiz-feedback");
        const quizKey = "q" + qIdx;

        // restore if already answered
        if (state.quizCorrect[quizKey] !== undefined) {
            opts.forEach((opt) => {
                opt.disabled = true;
                if (opt.dataset.correct === "true") opt.classList.add("correct");
            });
            feedback.textContent = state.quizCorrect[quizKey]
                ? "✅ ¡Correcto! Ya marcaste esta respuesta antes."
                : "Ya respondiste esta pregunta anteriormente.";
            feedback.classList.add(state.quizCorrect[quizKey] ? "correct" : "incorrect");
        }

        opts.forEach((opt) => {
            opt.addEventListener("click", () => {
                if (opt.disabled) return;
                const isCorrect = opt.dataset.correct === "true";
                opts.forEach((o) => (o.disabled = true));

                if (isCorrect) {
                    opt.classList.add("correct");
                    feedback.textContent = "✅ ¡Correcto! Buen razonamiento.";
                    feedback.classList.add("correct");
                } else {
                    opt.classList.add("incorrect");
                    const correctOpt = opts.find((o) => o.dataset.correct === "true");
                    if (correctOpt) correctOpt.classList.add("correct");
                    feedback.textContent = "❌ No del todo. Revisa la opción marcada en verde.";
                    feedback.classList.add("incorrect");
                }

                state.quizCorrect[quizKey] = isCorrect;
                saveState();
                updateStats();
            });
        });
    });

    // ---- Checklist ----
    document.querySelectorAll(".checklist-item input[type='checkbox']").forEach((box) => {
        const key = box.dataset.k;
        if (state.checklist[key]) box.checked = true;

        box.addEventListener("change", () => {
            state.checklist[key] = box.checked;
            saveState();
            updateStats();
        });
    });

    // ---- Stats ----
    function updateStats() {
        const exploredCount = Object.values(state.explored).filter(Boolean).length;
        statExplored.textContent = exploredCount;

        const quizKeys = Object.keys(state.quizCorrect);
        const quizCorrectCount = quizKeys.filter((k) => state.quizCorrect[k]).length;
        const quizTotal = document.querySelectorAll(".quiz-box").length;
        const quizPct = quizTotal > 0 ? Math.round((quizCorrectCount / quizTotal) * 100) : 0;
        statQuiz.textContent = quizPct;

        const checklistBoxes = document.querySelectorAll(".checklist-item input[type='checkbox']");
        const checklistChecked = Array.from(checklistBoxes).filter((b) => b.checked).length;
        const checklistPct = checklistBoxes.length > 0
            ? Math.round((checklistChecked / checklistBoxes.length) * 100)
            : 0;
        statChecklist.textContent = checklistPct;
    }

    updateStats();
})();

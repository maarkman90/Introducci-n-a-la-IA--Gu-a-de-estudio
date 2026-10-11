// ==========================================================================
// GUÍA DE ESTUDIO INTERACTIVA — MÓDULO 1
// Lógica de Estado, Interactividad y Gamificación
// Autor: Marcos Cruz A.
// ==========================================================================

(function () {
  "use strict";

  const STORAGE_KEY = "guia_ia_modulo1_progress";

  // ---- Cargar / Guardar Estado en LocalStorage ----
  const state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* ignore */
    }
    return {
      explored: {},
      checklist: {},
      quizCorrect: {},
      layersInspected: {},
      decisionChecked: {}
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  }

  // ---- Elementos de Navegación y Progreso ----
  const sections = Array.from(document.querySelectorAll(".block-section"));
  const navDotsContainer = document.getElementById("navDots");
  const progressBar = document.getElementById("progressBar");
  const statExplored = document.getElementById("statExplored");
  const statTotal = document.getElementById("statTotal");
  const statQuiz = document.getElementById("statQuiz");
  const statChecklist = document.getElementById("statChecklist");

  if (statTotal) {
    statTotal.textContent = sections.length;
  }

  // Generar Nav Dots dinámicos (Desktop)
  if (navDotsContainer && sections.length > 0) {
    navDotsContainer.innerHTML = "";
    sections.forEach((sec, idx) => {
      const dot = document.createElement("div");
      dot.className = "nav-dot";
      const heading = sec.querySelector("h2");
      dot.title = heading ? heading.textContent.trim() : `Bloque ${idx + 1}`;
      dot.addEventListener("click", () => {
        sec.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      navDotsContainer.appendChild(dot);
    });
  }
  const navDots = navDotsContainer ? Array.from(navDotsContainer.children) : [];

  // ---- Intersection Observer: Bloques explorados ----
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const idx = sections.indexOf(entry.target);
        if (entry.isIntersecting) {
          navDots.forEach((d) => d.classList.remove("active"));
          if (navDots[idx]) navDots[idx].classList.add("active");

          if (!state.explored[entry.target.id]) {
            state.explored[entry.target.id] = true;
            if (navDots[idx]) navDots[idx].classList.add("done");
            entry.target.classList.add("explored");
            saveState();
            updateAllStats();
          }
        }
      });
    },
    { threshold: 0.25 }
  );

  sections.forEach((sec, idx) => {
    observer.observe(sec);
    if (state.explored[sec.id]) {
      sec.classList.add("explored");
      if (navDots[idx]) navDots[idx].classList.add("done");
    }
  });

  // ---- Barra de Progreso de Scroll ----
  function updateScrollProgress() {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = Math.min(100, Math.max(0, pct)) + "%";
  }
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  updateScrollProgress();

  // ---- Actualización de Métricas Globales ----
  function updateAllStats() {
    // 1. Explorados
    const exploredCount = Object.keys(state.explored).length;
    if (statExplored) statExplored.textContent = exploredCount;

    // 2. Checklist
    const allCheckboxes = document.querySelectorAll(".checklist-item input[type='checkbox']");
    const totalChecks = allCheckboxes.length;
    const checkedCount = Object.values(state.checklist).filter(Boolean).length;
    const checkPct = totalChecks > 0 ? Math.round((checkedCount / totalChecks) * 100) : 0;
    if (statChecklist) statChecklist.textContent = checkPct;

    // 3. Quizzes
    const allQuizzes = document.querySelectorAll(".quiz-box");
    const totalQuizzes = allQuizzes.length;
    const correctCount = Object.values(state.quizCorrect).filter(Boolean).length;
    const quizPct = totalQuizzes > 0 ? Math.round((correctCount / totalQuizzes) * 100) : 0;
    if (statQuiz) statQuiz.textContent = quizPct;
  }

  // ==========================================================================
  // BLOQUE 2: SIMULADOR DE TEMPERATURA Y PROBABILIDADES
  // ==========================================================================
  const tempSlider = document.getElementById("tempSlider");
  const tempValDisplay = document.getElementById("tempValDisplay");
  const tempVerdictText = document.getElementById("tempVerdictText");
  const probBar1 = document.getElementById("probBar1");
  const probPct1 = document.getElementById("probPct1");
  const probBar2 = document.getElementById("probBar2");
  const probPct2 = document.getElementById("probPct2");
  const probBar3 = document.getElementById("probBar3");
  const probPct3 = document.getElementById("probPct3");
  const probBar4 = document.getElementById("probBar4");
  const probPct4 = document.getElementById("probPct4");

  function updateTemperatureSimulation(val) {
    const t = parseFloat(val);
    if (tempValDisplay) tempValDisplay.textContent = t.toFixed(2);

    // Calcular distribución de softmax con temperatura
    // Base logits aproximados para: "El cielo es [___]"
    // Logits: [4.0, 2.2, 0.5, -1.0] -> "azul", "despejado", "inmenso", "verde"
    let p1, p2, p3, p4;
    let verdict = "";

    if (t < 0.2) {
      p1 = 98; p2 = 2; p3 = 0; p4 = 0;
      verdict = "🔒 <strong>Modo Ultra-Determinista (T=0):</strong> El modelo selecciona casi invariablemente el token con máxima probabilidad. Cero sorpresas. Ideal para matemáticas, código, extracción de datos y JSON estricto.";
    } else if (t <= 0.8) {
      // Distribución normal
      const f = (t - 0.2) / 0.6; // 0 a 1
      p1 = Math.round(98 - f * 33); // 98 -> 65
      p2 = Math.round(2 + f * 20);  // 2 -> 22
      p3 = Math.round(f * 10);      // 0 -> 10
      p4 = Math.round(f * 3);       // 0 -> 3
      verdict = "⚖️ <strong>Modo Equilibrado (T=0.7):</strong> Creatividad natural con sintaxis impecable. Es el valor por defecto en ChatGPT y Claude. Ideal para redacción, análisis, traducción y resúmenes.";
    } else {
      // Alta temperatura
      const f = (t - 0.8) / 0.7; // 0 a 1
      p1 = Math.round(65 - f * 25); // 65 -> 40
      p2 = Math.round(22 + f * 3);  // 22 -> 25
      p3 = Math.round(10 + f * 12); // 10 -> 22
      p4 = Math.round(3 + f * 10);  // 3 -> 13
      verdict = "🎲 <strong>Modo Creativo / Caótico (T>1.0):</strong> La distribución se aplana; tokens raros tienen alta probabilidad de ser elegidos. Estimula metáforas y ficción, pero incrementa drásticamente las alucinaciones y la incoherencia lógica.";
    }

    if (probBar1 && probPct1) { probBar1.style.width = p1 + "%"; probPct1.textContent = p1 + "%"; }
    if (probBar2 && probPct2) { probBar2.style.width = p2 + "%"; probPct2.textContent = p2 + "%"; }
    if (probBar3 && probPct3) { probBar3.style.width = p3 + "%"; probPct3.textContent = p3 + "%"; }
    if (probBar4 && probPct4) { probBar4.style.width = p4 + "%"; probPct4.textContent = p4 + "%"; }
    if (tempVerdictText) tempVerdictText.innerHTML = verdict;
  }

  if (tempSlider) {
    tempSlider.addEventListener("input", (e) => updateTemperatureSimulation(e.target.value));
    updateTemperatureSimulation(tempSlider.value || 0.7);
  }

  // ==========================================================================
  // BLOQUE 2: TOKENIZADOR INTERACTIVO EN TIEMPO REAL
  // ==========================================================================
  const tokenInput = document.getElementById("tokenInput");
  const tokenPreviewBox = document.getElementById("tokenPreviewBox");
  const liveTokenCount = document.getElementById("liveTokenCount");
  const liveCharCount = document.getElementById("liveCharCount");
  const liveCostEstimate = document.getElementById("liveCostEstimate");

  function tokenizeText(text) {
    if (!text || text.trim() === "") {
      if (tokenPreviewBox) tokenPreviewBox.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">Escribe algo arriba para ver los tokens desglosados...</span>';
      if (liveTokenCount) liveTokenCount.textContent = "0";
      if (liveCharCount) liveCharCount.textContent = "0";
      if (liveCostEstimate) liveCostEstimate.textContent = "$0.0000";
      return;
    }

    // Heurística de tokenización para español (aproximadamente 1 token cada ~4 caracteres o división de palabras compuestas)
    const words = text.match(/\S+|\s+/g) || [];
    const tokens = [];

    words.forEach((w) => {
      if (w.trim() === "") {
        tokens.push("␣");
      } else if (w.length > 7) {
        // Partir palabras largas en subwords
        const mid = Math.ceil(w.length / 2);
        tokens.push(w.slice(0, mid));
        tokens.push(w.slice(mid));
      } else {
        tokens.push(w);
      }
    });

    if (tokenPreviewBox) {
      tokenPreviewBox.innerHTML = tokens
        .map((t) => `<span class="token-chip-badge">${escapeHtml(t)}</span>`)
        .join("");
    }

    const tCount = tokens.length;
    if (liveTokenCount) liveTokenCount.textContent = tCount;
    if (liveCharCount) liveCharCount.textContent = text.length;

    // Costo estimado por 1,000 llamadas a GPT-4o / Gemini 1.5 Flash ($0.15 / 1M tokens)
    const cost = ((tCount * 1000) / 1000000) * 0.15;
    if (liveCostEstimate) liveCostEstimate.textContent = `$${cost.toFixed(4)} USD`;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  if (tokenInput) {
    tokenInput.addEventListener("input", (e) => tokenizeText(e.target.value));
    tokenizeText(tokenInput.value);
  }

  // Presets para Tokenizador
  document.querySelectorAll(".btn-token-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sample = btn.dataset.sample;
      if (tokenInput && sample) {
        tokenInput.value = sample;
        tokenizeText(sample);
      }
    });
  });

  // ==========================================================================
  // BLOQUE 3: DESARMADOR DE CAPAS (MODELO VS API VS APP)
  // ==========================================================================
  document.querySelectorAll(".layer-interactive-card").forEach((card) => {
    card.addEventListener("click", () => {
      const isAlreadyActive = card.classList.contains("active");
      document.querySelectorAll(".layer-interactive-card").forEach((c) => c.classList.remove("active"));
      if (!isAlreadyActive) {
        card.classList.add("active");
      }
    });
  });

  // ==========================================================================
  // BLOQUE 4: MATRIZ DE DECISIÓN (PROMPT VS RAG VS FINE-TUNING)
  // ==========================================================================
  const decisionData = {
    doc_qa: {
      title: "Solución Recomendada: RAG (Retrieval Augmented Generation)",
      reason: "Las políticas cambian frecuentemente y ocupan cientos de páginas. Entrenar el modelo (Fine-Tuning) sería costoso y propenso a desactualizarse. RAG busca los fragmentos exactos en el PDF en tiempo real y cita las páginas precisas sin alterar los pesos del modelo."
    },
    json_format: {
      title: "Solución Recomendada: Prompt Engineering / Instrucciones de Sistema",
      reason: "No requieres inyectar nuevos documentos ni reentrenar. Un buen System Prompt estructurado con Few-Shot (un ejemplo de entrada y salida) y 'Response Schema / JSON Mode' garantiza el formato sin costo adicional."
    },
    medical_dialect: {
      title: "Solución Recomendada: Fine-Tuning de Modelo Base",
      reason: "El objetivo aquí no es recuperar un dato específico, sino modificar el estilo intrínseco, la jerga y la distribución de vocabulario clínico especializado de los pesos neuronales para que adopte el comportamiento del hospital."
    },
    live_account: {
      title: "Solución Recomendada: RAG + Function Calling (Tools)",
      reason: "El saldo bancario es información dinámica y confidencial que cambia cada segundo. El modelo debe invocar una API bancaria en tiempo real (Tool) para responder con exactitud transaccional."
    }
  };

  const decisionSolutionTitle = document.getElementById("decisionSolutionTitle");
  const decisionSolutionReason = document.getElementById("decisionSolutionReason");

  document.querySelectorAll(".btn-decision-scenario").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.scenario;
      document.querySelectorAll(".btn-decision-scenario").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const sol = decisionData[key];
      if (sol && decisionSolutionTitle && decisionSolutionReason) {
        decisionSolutionTitle.textContent = sol.title;
        decisionSolutionReason.textContent = sol.reason;
      }
    });
  });

  // ==========================================================================
  // FLASHCARDS 3D (GIRO EN CLIC / TOUCH)
  // ==========================================================================
  document.querySelectorAll(".flashcard").forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("flipped");
    });
  });

  // ==========================================================================
  // ACCORDIONS (MISIONES DE INVESTIGACIÓN)
  // ==========================================================================
  document.querySelectorAll(".accordion").forEach((acc) => {
    const head = acc.querySelector(".accordion-head");
    if (head) {
      head.addEventListener("click", () => {
        acc.classList.toggle("open");
      });
    }
  });

  // ==========================================================================
  // CHIPS DE BÚSQUEDA
  // ==========================================================================
  document.querySelectorAll(".search-term-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const query = chip.textContent.replace("🔎", "").trim();
      const url = "https://www.google.com/search?q=" + encodeURIComponent(query);
      window.open(url, "_blank", "noopener");
    });
  });

  // ==========================================================================
  // QUIZZES DE AUTOEVALUACIÓN
  // ==========================================================================
  document.querySelectorAll(".quiz-box").forEach((box, qIdx) => {
    const opts = Array.from(box.querySelectorAll(".quiz-opt"));
    const feedback = box.querySelector(".quiz-feedback");
    const quizKey = "m1_q" + qIdx;

    if (state.quizCorrect[quizKey] !== undefined) {
      opts.forEach((opt) => {
        opt.disabled = true;
        if (opt.dataset.correct === "true") opt.classList.add("correct");
      });
      if (feedback) {
        feedback.className = `quiz-feedback show ${state.quizCorrect[quizKey] ? "correct" : "incorrect"}`;
        feedback.textContent = state.quizCorrect[quizKey]
          ? "✅ ¡Respuesta correcta guardada!"
          : "Ya respondiste este reactivo anteriormente.";
      }
    }

    opts.forEach((opt) => {
      opt.addEventListener("click", () => {
        if (opt.disabled) return;
        const isCorrect = opt.dataset.correct === "true";
        opts.forEach((o) => (o.disabled = true));

        state.quizCorrect[quizKey] = isCorrect;
        saveState();

        if (isCorrect) {
          opt.classList.add("correct");
          if (feedback) {
            feedback.className = "quiz-feedback show correct";
            feedback.textContent = "✅ ¡Exacto! Demuestras una comprensión sólida de los fundamentos del modelo.";
          }
        } else {
          opt.classList.add("incorrect");
          const correctOpt = opts.find((o) => o.dataset.correct === "true");
          if (correctOpt) correctOpt.classList.add("correct");
          if (feedback) {
            feedback.className = "quiz-feedback show incorrect";
            feedback.textContent = "❌ Incorrecto. Revisa la opción en verde y el sustento conceptual.";
          }
        }
        updateAllStats();
      });
    });
  });

  // ==========================================================================
  // CHECKLIST DE DOMINIO PROFESIONAL
  // ==========================================================================
  document.querySelectorAll(".checklist-item input[type='checkbox']").forEach((cb) => {
    const key = cb.dataset.k;
    const parent = cb.closest(".checklist-item");

    if (state.checklist[key]) {
      cb.checked = true;
      if (parent) parent.classList.add("checked");
    }

    cb.addEventListener("change", () => {
      state.checklist[key] = cb.checked;
      if (parent) parent.classList.toggle("checked", cb.checked);
      saveState();
      updateAllStats();
    });
  });

  // Inicializar estado en pantalla
  updateAllStats();
})();

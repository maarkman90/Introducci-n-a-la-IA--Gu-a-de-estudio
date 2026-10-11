// ==========================================================================
// GUÍA DE ESTUDIO INTERACTIVA — MÓDULO 2
// Lógica de Estado, Interactividad y Gamificación
// Autor: Marcos Cruz A.
// ==========================================================================

(function () {
  "use strict";

  const STORAGE_KEY = "guia_ia_modulo2_progress";

  // ---- Cargar / Guardar Estado en LocalStorage ----
  const state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* ignore storage error */
    }
    return {
      explored: {},
      checklist: {},
      quizCorrect: {},
      classifiedScenarios: {},
      filtersChecked: {}
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore storage error */
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
  // MINI-LAB 0: SEMÁFORO DE GOBERNANZA & CLASIFICACIÓN
  // ==========================================================================
  const scenariosData = [
    {
      id: "sc1",
      text: "Base de datos de clientes con nombres completos, RFC/DNI, salarios y tarjetas de crédito.",
      correct: "red",
      explanation: "🔴 ROJO (Prohibido en la nube): Contiene PII crítica y secretos financieros que violan GDPR/regulaciones bancarias si se suben a chats públicos."
    },
    {
      id: "sc2",
      text: "Procedimiento operativo interno de despliegue y notas de arquitectura sin credenciales ni PII.",
      correct: "yellow",
      explanation: "🟡 AMARILLO (Sensible Interno): Apto para LM Studio local desconectado o en nube corporativa privada tras anonimizar rutas."
    },
    {
      id: "sc3",
      text: "Paquete documental anonimizado del 'Proyecto Phoenix' y datos sintéticos de prueba del curso.",
      correct: "green",
      explanation: "🟢 VERDE (Aprobado): Diseñado específicamente para talleres, seguro para utilizar en cualquier herramienta en la nube como NotebookLM."
    },
    {
      id: "sc4",
      text: "Llaves privadas de API de Stripe y tokens de acceso al repositorio en la nube de producción.",
      correct: "red",
      explanation: "🔴 ROJO (Peligro crítico): Credenciales vivas jamás deben tocar un LLM, ni siquiera por accidente. Riesgo inmediato de compromiso de infraestructura."
    }
  ];

  let currentScenarioIdx = 0;
  const scenarioTextEl = document.getElementById("scenarioText");
  const scenarioFeedbackEl = document.getElementById("scenarioFeedback");
  const nextScenarioBtn = document.getElementById("btnNextScenario");

  function renderScenario(idx) {
    if (!scenarioTextEl) return;
    const sc = scenariosData[idx];
    scenarioTextEl.textContent = `Caso ${idx + 1} de ${scenariosData.length}: "${sc.text}"`;
    if (scenarioFeedbackEl) {
      scenarioFeedbackEl.className = "classifier-feedback";
      scenarioFeedbackEl.style.display = "none";
      scenarioFeedbackEl.textContent = "";
    }
  }

  document.querySelectorAll(".btn-classify").forEach((btn) => {
    btn.addEventListener("click", () => {
      const selected = btn.dataset.tier;
      const sc = scenariosData[currentScenarioIdx];
      if (!scenarioFeedbackEl) return;

      const isCorrect = selected === sc.correct;
      scenarioFeedbackEl.style.display = "block";
      scenarioFeedbackEl.className = `classifier-feedback show ${isCorrect ? "correct" : "incorrect"}`;
      scenarioFeedbackEl.textContent = isCorrect
        ? `✅ ¡Correcto! ${sc.explanation}`
        : `❌ Criterio incorrecto. Revisa: ${sc.explanation}`;

      state.classifiedScenarios[sc.id] = isCorrect;
      saveState();
    });
  });

  if (nextScenarioBtn) {
    nextScenarioBtn.addEventListener("click", () => {
      currentScenarioIdx = (currentScenarioIdx + 1) % scenariosData.length;
      renderScenario(currentScenarioIdx);
    });
  }
  renderScenario(0);

  // ==========================================================================
  // BLOQUE 1: DIFF COMPARATOR (PROMPT VS ESPECIFICACIÓN)
  // ==========================================================================
  const diffTabs = document.querySelectorAll(".diff-tab");
  const diffPanes = document.querySelectorAll(".diff-pane");

  diffTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;
      diffTabs.forEach((t) => t.classList.remove("active"));
      diffPanes.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const activePane = document.getElementById(target);
      if (activePane) activePane.classList.add("active");
    });
  });

  // Botón Copiar Snippets
  document.querySelectorAll(".btn-copy-code").forEach((btn) => {
    btn.addEventListener("click", () => {
      const codeTargetId = btn.dataset.codeTarget;
      const codeEl = document.getElementById(codeTargetId);
      if (codeEl) {
        const textToCopy = codeEl.innerText.replace(/PRO /g, "").replace(/MEDIOCRE /g, "").trim();
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalText = btn.innerHTML;
          btn.innerHTML = "✅ ¡Copiado al portapapeles!";
          btn.style.background = "var(--accent-emerald)";
          btn.style.color = "#050811";
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = "";
            btn.style.color = "";
          }, 2400);
        });
      }
    });
  });

  // ==========================================================================
  // BLOQUE 2: MATRIZ DE 9 VARIABLES (PROMPT BUILDER VISUAL)
  // ==========================================================================
  const varSujeto = document.getElementById("varSujeto");
  const varEntorno = document.getElementById("varEntorno");
  const varEstilo = document.getElementById("varEstilo");
  const varIluminacion = document.getElementById("varIluminacion");
  const varCamara = document.getElementById("varCamara");
  const varComposicion = document.getElementById("varComposicion");
  const varAspect = document.getElementById("varAspect");
  const varNegativos = document.getElementById("varNegativos");
  const promptOutputEl = document.getElementById("promptOutput");
  const btnCopyPrompt = document.getElementById("btnCopyPrompt");

  function updateVisualPrompt() {
    if (!promptOutputEl) return;
    const parts = [
      varSujeto ? varSujeto.value : "",
      varEntorno ? varEntorno.value : "",
      varComposicion ? varComposicion.value : "",
      varIluminacion ? varIluminacion.value : "",
      varEstilo ? varEstilo.value : "",
      varCamara ? varCamara.value : "",
      varAspect ? varAspect.value : "",
      varNegativos ? `--no ${varNegativos.value}` : ""
    ].filter(Boolean);

    promptOutputEl.textContent = parts.join(", ");
  }

  [varSujeto, varEntorno, varEstilo, varIluminacion, varCamara, varComposicion, varAspect, varNegativos].forEach(
    (input) => {
      if (input) input.addEventListener("change", updateVisualPrompt);
      if (input && input.tagName === "INPUT") input.addEventListener("input", updateVisualPrompt);
    }
  );
  updateVisualPrompt();

  if (btnCopyPrompt) {
    btnCopyPrompt.addEventListener("click", () => {
      if (promptOutputEl) {
        navigator.clipboard.writeText(promptOutputEl.textContent).then(() => {
          const orig = btnCopyPrompt.innerHTML;
          btnCopyPrompt.innerHTML = "✨ ¡Prompt de Portada Copiado!";
          btnCopyPrompt.style.background = "var(--accent-cyan)";
          btnCopyPrompt.style.color = "#000";
          setTimeout(() => {
            btnCopyPrompt.innerHTML = orig;
            btnCopyPrompt.style.background = "";
            btnCopyPrompt.style.color = "";
          }, 2400);
        });
      }
    });
  }

  // ==========================================================================
  // BLOQUE 3: STORYBOARD TEMPORAL (0-10s EN 3 TOMAS)
  // ==========================================================================
  const storyboardData = {
    shot1: {
      time: "0 a 3 segundos",
      name: "Toma 1: Establecimiento y Contexto",
      camera: "Travelling frontal lento (Slow forward dolly) • Gran Angular 24mm",
      action: "La cámara se desplaza suavemente entre los pasillos de cristal de una oficina corporativa iluminada por luces de ciudad al anochecer.",
      prompt: "Cinematic establishing shot, slow camera forward travelling through modern glass corporate office corridor, evening ambient blue light, high cinematic quality, 24fps --ar 16:9"
    },
    shot2: {
      time: "3 a 6 segundos",
      name: "Toma 2: Conexión Humana y Foco",
      camera: "Dolly-in sutil a Plano Medio • Lente 50mm f/1.8",
      action: "Acercamiento a la arquitecta del Proyecto Phoenix revisando métricas de conciliación en su pantalla, con gesto de concentración.",
      prompt: "Medium close-up shot, slow push-in towards focused female software architect analyzing real-time financial data charts, natural screen glow, cinematic shallow depth of field --ar 16:9"
    },
    shot3: {
      time: "6 a 10 segundos",
      name: "Toma 3: Revelación de Resultados y Órbita",
      camera: "Giro orbital continuo de 45° (Continuous Orbit) • Plano Detalle",
      action: "La cámara orbita alrededor del monitor mientras el sistema Phoenix procesa una transacción masiva con validación verde de seguridad.",
      prompt: "Dynamic orbital camera movement around laptop display showing data reconciliation completed with green checkmarks, neon data particles floating, 4k hyper-realistic --ar 16:9"
    }
  };

  const timelineBtns = document.querySelectorAll(".timeline-segment-btn");
  const shotTitleEl = document.getElementById("shotTitle");
  const shotCameraEl = document.getElementById("shotCamera");
  const shotActionEl = document.getElementById("shotAction");
  const shotPromptEl = document.getElementById("shotPrompt");

  function renderShot(shotKey) {
    const data = storyboardData[shotKey];
    if (!data) return;
    if (shotTitleEl) shotTitleEl.textContent = `${data.time} • ${data.name}`;
    if (shotCameraEl) shotCameraEl.textContent = data.camera;
    if (shotActionEl) shotActionEl.textContent = data.action;
    if (shotPromptEl) shotPromptEl.textContent = data.prompt;
  }

  timelineBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const shotKey = btn.dataset.shot;
      timelineBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderShot(shotKey);
    });
  });
  renderShot("shot1");

  // ==========================================================================
  // BLOQUE 4: GROUNDING & CITAS DE AUDITORÍA EN NOTEBOOKLM
  // ==========================================================================
  const auditQuestionsData = {
    q1: {
      question: "¿Cuáles son los objetivos prioritarios del Proyecto Phoenix?",
      groundedText: "El objetivo principal consensuado es modernizar el motor de pagos y facturación electrónica para soportar 15,000 transacciones por minuto con una disponibilidad del 99.99% [1], con un presupuesto aprobado de $120,000 USD [2].",
      citations: {
        1: { source: "Requerimientos_Funcionales_v2.docx (Sección 1.2)", quote: "El nuevo motor transaccional debe procesar un pico de hasta 15,000 tpm manteniendo SLA de 99.99%." },
        2: { source: "Minuta_Comite_Q3.pdf (Pág 2, Punto 4)", quote: "Se aprueba por unanimidad la partida presupuestal de $120,000 USD para la Fase 1 del Proyecto Phoenix." }
      }
    },
    q2: {
      question: "¿Qué decisiones ya fueron tomadas vs qué puntos siguen abiertos?",
      groundedText: "Se aprobó el uso de arquitectura serverless en nube híbrida y la pasarela de pagos primaria [1]. Sigue pendiente la selección del proveedor secundario de contingencia ante fallos bancarios [2].",
      citations: {
        1: { source: "Minuta_Comite_Q3.pdf (Pág 1)", quote: "Decisión ratificada: arquitectura cloud-native con conmutación en caliente." },
        2: { source: "Notas_Riesgos_Tecnicos.txt (Línea 14)", quote: "Abierto a comité: evaluar redundancia con segundo adquirente." }
      }
    },
    q3: {
      question: "¿Qué riesgos técnicos críticos aparecen en más de un documento?",
      groundedText: "La migración de la base de datos heredada (Legacy Oracle) presenta riesgos de latencia en bloqueos de tablas [1] y posibles inconsistencias de esquema durante la conciliación nocturna [2].",
      citations: {
        1: { source: "Pitch_Deck_Cliente_Legacy.pptx (Diapositiva 8)", quote: "Riesgo operativo: tiempos de respuesta legacy superiores a 800ms en horas pico." },
        2: { source: "Notas_Riesgos_Tecnicos.txt (Línea 22)", quote: "La base legacy no soporta transacciones distribuidas sin riesgo de deadlock." }
      }
    },
    q4: {
      question: "🔥 LA PRUEBA REINA: ¿Hay discrepancias o contradicciones entre las fuentes?",
      groundedText: "¡SÍ! Se detecta una discrepancia crítica de 25 DÍAS: La Minuta del Comité establece como fecha irrevocable de salida a producción el 15 de noviembre [1], pero la hoja Plan_Avance_Sprints.xlsx tiene tareas de pruebas de carga programadas hasta el 10 de diciembre [2].",
      citations: {
        1: { source: "Minuta_Comite_Q3.pdf (Pág 3)", quote: "Go-live mandatorio e impostergable pactado para el 15 de noviembre." },
        2: { source: "Plan_Avance_Sprints.xlsx (Pestaña 'Testing')", quote: "Sprint 6 (Carga y Estrés): del 20 de noviembre al 10 de diciembre." }
      }
    },
    q5: {
      question: "¿Para cada conclusión, indica la fuente exacta que la respalda?",
      groundedText: "Toda afirmación emitida por NotebookLM cuenta con citas numéricas interactivas ancladas exclusivamente a los 5 archivos cargados, eliminando por completo la alucinación estocástica de internet.",
      citations: {
        1: { source: "Motor de Grounding Gemini 1.5 Pro en NotebookLM", quote: "Índice vectorial y citación semántica exacta de fuentes cargadas." }
      }
    }
  };

  const auditQBtns = document.querySelectorAll(".audit-q-btn");
  const auditQTitleEl = document.getElementById("auditQTitle");
  const auditTextEl = document.getElementById("auditText");
  const sourceEvidenceDrawer = document.getElementById("sourceEvidenceDrawer");
  const evidenceTitleEl = document.getElementById("evidenceTitle");
  const evidenceQuoteEl = document.getElementById("evidenceQuote");

  function renderAuditQuestion(qKey) {
    const data = auditQuestionsData[qKey];
    if (!data) return;
    if (auditQTitleEl) auditQTitleEl.textContent = data.question;

    if (auditTextEl) {
      // Reemplazar [1], [2] con chips interactivos clicables
      let formatted = data.groundedText.replace(/\[(\d+)\]/g, (match, p1) => {
        return `<span class="citation-chip" data-cite="${p1}" title="Clic para ver fragmento original">[${p1}]</span>`;
      });
      auditTextEl.innerHTML = formatted;

      // Asignar eventos a las citas
      auditTextEl.querySelectorAll(".citation-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          const citeNum = chip.dataset.cite;
          const citeData = data.citations[citeNum];
          if (citeData && sourceEvidenceDrawer) {
            sourceEvidenceDrawer.classList.add("show");
            if (evidenceTitleEl) evidenceTitleEl.innerHTML = `📄 Fuente Citada [${citeNum}]: <strong>${citeData.source}</strong>`;
            if (evidenceQuoteEl) evidenceQuoteEl.textContent = `"${citeData.quote}"`;
          }
        });
      });
    }

    if (sourceEvidenceDrawer) {
      sourceEvidenceDrawer.classList.remove("show");
    }
  }

  auditQBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const qKey = btn.dataset.q;
      auditQBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderAuditQuestion(qKey);
    });
  });
  renderAuditQuestion("q4"); // Comenzar mostrando la prueba reina

  // ==========================================================================
  // BLOQUE 5: FACTORÍA MULTIFORMATO & HACKATHON TIMER
  // ==========================================================================
  const deliverablePdfs = {
    resumen: {
      title: "Resumen Ejecutivo de 1 Cuartilla (Comité Directivo)",
      body: `<strong>ESTADO DEL PROYECTO PHOENIX</strong><br>
      • <strong>Misión:</strong> Modernización de motor de pagos para soportar 15,000 tpm.<br>
      • <strong>Presupuesto:</strong> $120,000 USD aprobados en Q3.<br>
      • <strong>Alerta de Cronograma:</strong> Desfase detectado de 25 días entre el hito comercial (15 de nov) y el plan de pruebas de ingeniería (10 de dic).<br>
      • <strong>Recomendación:</strong> Priorizar la reducción de alcance en el módulo secundario para proteger la fecha crítica.`
    },
    riesgos: {
      title: "Matriz de Riesgos Cruzados (Auditoría Técnica)",
      body: `<strong>RIESGOS TÉCNICOS Y OPERATIVOS DETECTADOS</strong><br>
      1. <strong>Latencia en BD Legacy:</strong> Severidad Alta. Causa: bloqueo de tablas en conciliación nocturna.<br>
      2. <strong>Falta de Redundancia Bancaria:</strong> Severidad Media. Proveedor secundario pendiente de aprobación.<br>
      3. <strong>Desalineación de Sprints:</strong> Severidad Crítica. Riesgo de salir a producción sin pruebas de estrés completas.`
    },
    faq: {
      title: "FAQ de Negocio para Operaciones y Soporte",
      body: `<strong>PREGUNTAS FRECUENTES DE NEGOCIO</strong><br>
      • <strong>¿Se detendrán los cobros durante la migración?</strong> No, la arquitectura contempla despliegue canario sin tiempo de inactividad.<br>
      • <strong>¿Qué ocurre si la pasarela primaria falla?</strong> El sistema activa colas de reintento idempotentes antes de registrar incidentes.`
    },
    timeline: {
      title: "Timeline Crítico y Puntos de Decisión",
      body: `<strong>CRONOGRAMA CONSOLIDADO</strong><br>
      • <strong>Semana 1-2:</strong> Aprobación de arquitectura y presupuesto ($120k).<br>
      • <strong>Semana 3-6:</strong> Construcción de microservicios e integraciones.<br>
      • <strong>Semana 7-8:</strong> Pruebas de estrés vs. Hito de go-live (Requiere sesión de arbitraje).`
    },
    podcast: {
      title: "Guión Audio Overview (Podcast a 2 Voces)",
      body: `<strong>GUION SINTETIZADO NOTEBOOKLM</strong><br>
      <strong>Host A:</strong> "¡Bienvenidos! Hoy analizamos el Proyecto Phoenix. A primera vista parecía una modernización de pagos estándar de 120 mil dólares..."<br>
      <strong>Host B:</strong> "Pero al cruzar la minuta con la hoja de sprints encontramos una bomba de tiempo: ¡25 días de diferencia entre lo que prometieron y lo que pueden entregar!"`
    }
  };

  const factoryTabs = document.querySelectorAll(".factory-tab-btn");
  const deliverableTitleEl = document.getElementById("deliverableTitle");
  const deliverableBodyEl = document.getElementById("deliverableBody");

  factoryTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const type = tab.dataset.deliverable;
      factoryTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const data = deliverablePdfs[type];
      if (data) {
        if (deliverableTitleEl) deliverableTitleEl.textContent = data.title;
        if (deliverableBodyEl) deliverableBodyEl.innerHTML = data.body;
      }
    });
  });

  // Hackathon Countdown Timer (15 Minutos)
  let timerDuration = 15 * 60; // 900 segundos
  let timerInterval = null;
  const clockDisplayEl = document.getElementById("timerClockDisplay");
  const btnStartTimer = document.getElementById("btnStartTimer");
  const btnResetTimer = document.getElementById("btnResetTimer");

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function tickTimer() {
    if (timerDuration > 0) {
      timerDuration--;
      if (clockDisplayEl) clockDisplayEl.textContent = formatTime(timerDuration);
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      if (clockDisplayEl) clockDisplayEl.textContent = "00:00 ¡Tiempo!";
      if (btnStartTimer) btnStartTimer.textContent = "Iniciar";
    }
  }

  if (btnStartTimer) {
    btnStartTimer.addEventListener("click", () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        btnStartTimer.textContent = "Reanudar";
      } else {
        timerInterval = setInterval(tickTimer, 1000);
        btnStartTimer.textContent = "Pausar";
      }
    });
  }

  if (btnResetTimer) {
    btnResetTimer.addEventListener("click", () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      timerDuration = 15 * 60;
      if (clockDisplayEl) clockDisplayEl.textContent = "15:00";
      if (btnStartTimer) btnStartTimer.textContent = "Iniciar";
    });
  }

  // ==========================================================================
  // BLOQUE 6: CALCULADORA DE HARDWARE & MODO AVIÓN (LM STUDIO)
  // ==========================================================================
  const hardwareRecommendations = {
    8: {
      model: "Llama-3.2-3B-Instruct (GGUF Q4_K_M)",
      download: "2.2 GB",
      ramUsage: "~3.8 GB en uso",
      speed: "35–55 tokens/seg",
      verdict: "Óptimo para laptops estándar. Corre 100% fluido en CPU/GPU integrada."
    },
    16: {
      model: "Qwen2.5-7B-Instruct o Mistral-7B-v0.3 (GGUF Q4_K_M)",
      download: "4.5 GB",
      ramUsage: "~6.5 GB en uso",
      speed: "25–40 tokens/seg",
      verdict: "El estándar dorado corporativo. Excelente razonamiento sin saturar la máquina."
    },
    32: {
      model: "Qwen2.5-14B-Instruct o Command-R-35B (Q4_K_M)",
      download: "8.5 GB – 19 GB",
      ramUsage: "~12–22 GB en uso",
      speed: "18–30 tokens/seg",
      verdict: "Potencia de investigación avanzada y ventanas de contexto de 32k tokens."
    },
    64: {
      model: "Llama-3.3-70B-Instruct (Q4_K_M) o DeepSeek-V2.5",
      download: "38 GB",
      ramUsage: "~42 GB en uso",
      speed: "10–20 tokens/seg",
      verdict: "Estación de trabajo de grado profesional. Capacidad equivalente a GPT-4o totalmente local."
    }
  };

  const ramBtns = document.querySelectorAll(".btn-ram-select");
  const specModelName = document.getElementById("specModelName");
  const specDownload = document.getElementById("specDownload");
  const specRamUsage = document.getElementById("specRamUsage");
  const specSpeed = document.getElementById("specSpeed");
  const specVerdict = document.getElementById("specVerdict");

  function renderHardwareRecommendation(ramGb) {
    const data = hardwareRecommendations[ramGb];
    if (!data) return;
    if (specModelName) specModelName.textContent = data.model;
    if (specDownload) specDownload.textContent = data.download;
    if (specRamUsage) specRamUsage.textContent = data.ramUsage;
    if (specSpeed) specSpeed.textContent = data.speed;
    if (specVerdict) specVerdict.textContent = data.verdict;
  }

  ramBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const ram = btn.dataset.ram;
      ramBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderHardwareRecommendation(ram);
    });
  });
  renderHardwareRecommendation("16");

  // Modo Avión Toggle
  const btnToggleAirplane = document.getElementById("btnToggleAirplane");
  const airplaneStatusText = document.getElementById("airplaneStatusText");

  if (btnToggleAirplane) {
    btnToggleAirplane.addEventListener("click", () => {
      btnToggleAirplane.classList.toggle("offline");
      const isOffline = btnToggleAirplane.classList.contains("offline");
      if (isOffline) {
        btnToggleAirplane.innerHTML = "✈️ Modo Avión: ACTIVADO (100% Offline)";
        if (airplaneStatusText) {
          airplaneStatusText.innerHTML = "🔒 <strong>Conexión cortada:</strong> El modelo en LM Studio responde a máxima velocidad sin emitir un solo byte a servidores externos. Soberanía de datos garantizada.";
        }
      } else {
        btnToggleAirplane.innerHTML = "🌐 Modo Online (Wi-Fi Conectado)";
        if (airplaneStatusText) {
          airplaneStatusText.innerHTML = "Prueba a activar el Modo Avión para verificar que la inferencia ocurre localmente en tu memoria RAM.";
        }
      }
    });
  }

  // ==========================================================================
  // BLOQUE 7: LOS 5 FILTROS CRÍTICOS POST-GENERACIÓN
  // ==========================================================================
  const filterCheckboxes = document.querySelectorAll(".filter-check-item input[type='checkbox']");
  const filterMaturityBar = document.getElementById("filterMaturityBar");
  const filterMaturityText = document.getElementById("filterMaturityText");

  function updateFiltersMaturity() {
    let checkedCount = 0;
    filterCheckboxes.forEach((cb) => {
      if (cb.checked) checkedCount++;
      state.filtersChecked[cb.id] = cb.checked;
    });
    saveState();

    const pct = (checkedCount / filterCheckboxes.length) * 100;
    if (filterMaturityBar) filterMaturityBar.style.width = pct + "%";
    if (filterMaturityText) {
      if (checkedCount === 5) {
        filterMaturityText.textContent = "🏆 5/5: Entregable certificado para presentación a Junta Directiva.";
        filterMaturityText.style.color = "var(--accent-emerald)";
      } else if (checkedCount >= 3) {
        filterMaturityText.textContent = `${checkedCount}/5: Buen nivel de validación. Faltan filtros de seguridad y ética.`;
        filterMaturityText.style.color = "var(--accent-amber)";
      } else {
        filterMaturityText.textContent = `${checkedCount}/5: Borrador preliminar. Riesgo alto de alucinación o desalineación.`;
        filterMaturityText.style.color = "var(--accent-rose)";
      }
    }
  }

  filterCheckboxes.forEach((cb) => {
    if (state.filtersChecked[cb.id]) cb.checked = true;
    cb.addEventListener("change", updateFiltersMaturity);
  });
  updateFiltersMaturity();

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
    const quizKey = "m2_q" + qIdx;

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
            feedback.textContent = "✅ ¡Exacto! Demuestras criterio técnico sólido para entornos de producción.";
          }
        } else {
          opt.classList.add("incorrect");
          const correctOpt = opts.find((o) => o.dataset.correct === "true");
          if (correctOpt) correctOpt.classList.add("correct");
          if (feedback) {
            feedback.className = "quiz-feedback show incorrect";
            feedback.textContent = "❌ Incorrecto. Revisa la opción en verde y el sustento metodológico.";
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

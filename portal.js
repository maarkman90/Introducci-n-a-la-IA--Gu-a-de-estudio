// ==========================================================================
// PORTAL DE GUÍAS DE ESTUDIO INTERACTIVAS — LÓGICA
// Sincronización de Avance del Estudiante en LocalStorage
// Autor: Marcos Cruz A.
// ==========================================================================

(function () {
  "use strict";

  const KEY_M1 = "guia_ia_modulo1_progress";
  const KEY_M2 = "guia_ia_modulo2_progress";

  function readProgress(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  function updateStudentPortalStats() {
    const p1 = readProgress(KEY_M1);
    const p2 = readProgress(KEY_M2);

    const m1Badge = document.getElementById("m1ProgressBadge");
    const m2Badge = document.getElementById("m2ProgressBadge");
    const globalModulesCount = document.getElementById("globalModulesCount");

    let completedModules = 0;

    // Calcular progreso Módulo 1
    if (p1 && m1Badge) {
      const explored = p1.explored ? Object.keys(p1.explored).length : 0;
      const checked = p1.checklist ? Object.values(p1.checklist).filter(Boolean).length : 0;
      if (explored > 0 || checked > 0) {
        m1Badge.textContent = `⚡ Tu Avance: ${checked > 4 ? "Completado" : "En progreso"}`;
        m1Badge.style.background = "rgba(56, 224, 198, 0.2)";
        m1Badge.style.color = "var(--accent-cyan)";
        m1Badge.style.borderColor = "var(--accent-cyan)";
        if (checked >= 5) completedModules++;
      }
    }

    // Calcular progreso Módulo 2
    if (p2 && m2Badge) {
      const explored = p2.explored ? Object.keys(p2.explored).length : 0;
      const checked = p2.checklist ? Object.values(p2.checklist).filter(Boolean).length : 0;
      if (explored > 0 || checked > 0) {
        m2Badge.textContent = `⚡ Tu Avance: ${checked > 6 ? "Completado" : "En progreso"}`;
        m2Badge.style.background = "rgba(56, 224, 198, 0.2)";
        m2Badge.style.color = "var(--accent-cyan)";
        m2Badge.style.borderColor = "var(--accent-cyan)";
        if (checked >= 7) completedModules++;
      }
    }

    if (globalModulesCount) {
      globalModulesCount.textContent = `${completedModules}/2`;
    }
  }

  document.addEventListener("DOMContentLoaded", updateStudentPortalStats);
})();

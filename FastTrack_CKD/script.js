// =========================
// SEITE EINBLENDEN
// =========================
function berechneCKDStadium(eGFR, acr) {
  let G;
  let A;
  let risiko;
  let beschreibung;

  if (eGFR >= 90) {
    G = "G1";
    beschreibung = "normale bis erhöhte (Hyperfiltration)";
  } else if (eGFR >= 60) {
    G = "G2";
    beschreibung = "mild eingeschränkte bis normal";
  } else if (eGFR >= 45) {
    G = "G3a";
    beschreibung = "mild bis mittelschwer eingeschränkte";
  } else if (eGFR >= 30) {
    G = "G3b";
    beschreibung = "schwer bis mittelschwer eingeschränkte";
  } else if (eGFR >= 15) {
    G = "G4";
    beschreibung = "schwer eingeschränkte";
  } else {
    G = "G5";
    beschreibung = "Nierenversagen";
  }

  if (acr < 30) {
    A = "A1";
  } else if (acr < 300) {
    A = "A2";
  } else {
    A = "A3";
  }

  const risikoTabelle = {
    G1: { A1: 1, A2: 1, A3: 2 },
    G2: { A1: 1, A2: 1, A3: 2 },
    G3a: { A1: 1, A2: 2, A3: 3 },
    G3b: { A1: 2, A2: 3, A3: 3 },
    G4: { A1: 3, A2: 3, A3: "4+" },
    G5: { A1: "4+", A2: "4+", A3: "4+" },
  };

  risiko = risikoTabelle[G][A];

  return { G, A, risiko, beschreibung };
}

window.addEventListener("load", () => {
  document.body.classList.add("page-loaded");
});

// =========================
// SWEETALERT2 POPUP
// =========================
function showPopup(title, text, icon = "info") {
  if (typeof Swal === "undefined") return;
  Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: "OK",
    confirmButtonColor: "#2563eb",
    background: "#fff",
    color: "#1f2937",
    allowOutsideClick: true,
    allowEscapeKey: true,
  });
}

// =========================
// LOCAL STORAGE – ZWEI GETRENNTE SCHLÜSSEL
// =========================
const CKD_STORAGE_KEY = "ckdCalculatorData";
const NEPHRO_STORAGE_KEY = "nephroFormData";

// =========================
// GLOBALE VARIABLEN FÜR CKD
// =========================
let selectedGender = null;
let selectedOption = null;

// =========================
// HILFSFUNKTION
// =========================
function getElementSafe(selector) {
  return document.querySelector(selector);
}

// =========================
// NEPHRO ZUSAMMENFASSUNG GENERIEREN
// =========================
function getNephroSummary() {
  const savedData = localStorage.getItem(NEPHRO_STORAGE_KEY);
  if (!savedData) return "";
  const data = JSON.parse(savedData);
  let summary = "";

  // Atemnot
  if (data.option1) {
    summary += "Es wird über Atemnot geklagt.<br>";
  } else {
    summary += "Es wird nicht über Atemnot geklagt.<br>";
  }

  // Geschwollene Beine
  if (data.option2) {
    summary += "Geschwollene Beine fielen auf.<br>";
  } else {
    summary += "Geschwollene Beine fielen nicht auf.<br>";
  }

  // Blut im Urin
  if (data.option3) {
    summary += "Es wurde Blut im Urin beobachtet.<br>";
  } else {
    summary += "Es wurde kein Blut im Urin beobachtet.<br>";
  }

  // Brennen beim Wasserlassen
  if (data.option4) {
    summary += "Beschwerden eines Harnwegsinfektes werden berichtet.<br>";
  } else {
    summary +=
      "Es werden keine Beschwerden eines Harnwegsinfektes berichtet.<br>";
  }

  // Bluthochdruck
  if (data.option5) {
    const jahr = data.jahrblut ? data.jahrblut : "unbekannt";
    summary += `Es liegt eine arterielle Hypertension seit ca. ${jahr} vor.`;
    if (data.option6) {
      const wert = data.obererWert ? data.obererWert : "unbekannt";
      summary += ` Der Blutdruck liegt in der Selbstmessung bei ${wert} mmHg systolisch.`;
    }
    summary += "<br>";
  } else {
    summary += "Ein Bluthochdruck ist nicht bekannt.<br>";
  }

  return summary;
}

// =========================
// CKD – INITIALISIERUNG
// =========================
function initCKD() {
  const dropdownElement = getElementSafe(".custom-dropdown");
  const ageInput = document.getElementById("age");
  if (!dropdownElement && !ageInput) {
    return;
  }

  const dropdown = dropdownElement;
  let button, menu, options, arrow;

  if (dropdown) {
    button = dropdown.querySelector(".dropdown-button");
    menu = dropdown.querySelector(".dropdown-menu");
    options = dropdown.querySelectorAll(".dropdown-option");
    selectedOption = dropdown.querySelector(".selected-option");
    arrow = dropdown.querySelector(".arrow");
  }

  function saveCKDData() {
    const data = {
      age: document.getElementById("age")?.value || "",
      creatinine: document.getElementById("creatinine")?.value || "",
      acr: document.getElementById("acr")?.value || "",
      selectedGender: selectedGender,
      genderText: selectedOption ? selectedOption.textContent : "",
      egfr: document.getElementById("egfr-result")?.value || "",
      risk2: document.getElementById("risk2")?.textContent || "—",
      risk5: document.getElementById("risk5")?.textContent || "—",
    };
    localStorage.setItem(CKD_STORAGE_KEY, JSON.stringify(data));
  }

  function loadCKDData() {
    const savedData = localStorage.getItem(CKD_STORAGE_KEY);
    if (!savedData) return;
    const data = JSON.parse(savedData);

    if (document.getElementById("age"))
      document.getElementById("age").value = data.age || "";
    if (document.getElementById("creatinine"))
      document.getElementById("creatinine").value = data.creatinine || "";
    if (document.getElementById("acr"))
      document.getElementById("acr").value = data.acr || "";

    if (
      data.selectedGender !== null &&
      data.selectedGender !== undefined &&
      selectedOption
    ) {
      selectedGender = Number(data.selectedGender);
      selectedOption.textContent = data.genderText || "Option auswählen";
    }

    if (document.getElementById("egfr-result"))
      document.getElementById("egfr-result").value = data.egfr || "";
    if (document.getElementById("risk2"))
      document.getElementById("risk2").textContent = data.risk2 || "—";
    if (document.getElementById("risk5"))
      document.getElementById("risk5").textContent = data.risk5 || "—";
  }

  // Dropdown Events
  if (button && menu && arrow) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      menu.classList.toggle("active");
      arrow.classList.toggle("rotate");
    });
  }

  if (options) {
    options.forEach((option) => {
      option.addEventListener("click", () => {
        if (!selectedOption) return;
        selectedOption.textContent = option.textContent.trim();
        selectedGender = Number(option.dataset.value);
        if (menu) menu.classList.remove("active");
        if (arrow) arrow.classList.remove("rotate");
        saveCKDData();
      });
    });
  }

  document.addEventListener("click", () => {
    if (menu) menu.classList.remove("active");
    if (arrow) arrow.classList.remove("rotate");
  });

  // CKD Berechnung
  function calculateCKDEPI2021(age, male, creatinine) {
    let kappa, alpha;
    if (male === 1) {
      kappa = 0.9;
      alpha = -0.302;
    } else {
      kappa = 0.7;
      alpha = -0.241;
    }

    const creatinineRatio = creatinine / kappa;
    const minValue = Math.min(creatinineRatio, 1);
    const maxValue = Math.max(creatinineRatio, 1);

    let egfr =
      142 *
      Math.pow(minValue, alpha) *
      Math.pow(maxValue, -1.2) *
      Math.pow(0.9938, age);

    if (male === 0) {
      egfr *= 1.012;
    }

    return egfr;
  }

  function kfre(age, male, egfr, acr) {
    const lp =
      -0.2201 * (age / 10 - 7.036) +
      0.2467 * (male - 0.5642) -
      0.5567 * (egfr / 5 - 7.222) +
      0.451 * (Math.log(acr) - 5.137);

    const risk2 = 1 - Math.pow(0.9832, Math.exp(lp));
    const risk5 = 1 - Math.pow(0.9365, Math.exp(lp));

    return { risk2: risk2 * 100, risk5: risk5 * 100 };
  }

  const calculateButton = document.getElementById("calculate-button");
  if (calculateButton) {
    calculateButton.addEventListener("click", () => {
      let risikoBerechnen = true;

      const age = Number(document.getElementById("age")?.value);
      const creatinine = Number(document.getElementById("creatinine")?.value);
      const acr = Number(document.getElementById("acr")?.value);

      if (!age || creatinine <= 0 || acr <= 0 || selectedGender === null) {
        showPopup(
          "Fehlende Eingaben",
          "Bitte alle Werte eingeben und ein Geschlecht auswählen.",
          "warning",
        );
        return;
      }

      if (age < 18) {
        showPopup(
          "Berechnung nicht möglich",
          "Die Risikoabschätzung ist nur für Personen ab 18 Jahren validiert.",
          "error",
        );
        if (document.getElementById("egfr-result"))
          document.getElementById("egfr-result").value = "-";
        if (document.getElementById("risk2"))
          document.getElementById("risk2").textContent = "—";
        if (document.getElementById("risk5"))
          document.getElementById("risk5").textContent = "—";
        saveCKDData();
        risikoBerechnen = false;
      }

      const egfr = calculateCKDEPI2021(age, selectedGender, creatinine);
      if (document.getElementById("egfr-result"))
        document.getElementById("egfr-result").value = egfr.toFixed(1);

      if (age > 99) {
        showPopup(
          "Berechnung nicht möglich",
          "Eine Risikoabschätzung ist bei Menschen über 99 Jahre nicht möglich.",
          "error",
        );
        if (document.getElementById("risk2"))
          document.getElementById("risk2").textContent = "—";
        if (document.getElementById("risk5"))
          document.getElementById("risk5").textContent = "—";
        saveCKDData();
        risikoBerechnen = false;
      }

      if (egfr < 10) {
        showPopup(
          "Berechnung nicht möglich",
          "Bei einer eGFR unter 10 ml/min liegt im Regelfall bereits nierenersatztherapiepflichtiges Nierenversagen vor. Eine Risikoabschätzung ist daher nicht sinnvoll.",
          "error",
        );
        if (document.getElementById("risk2"))
          document.getElementById("risk2").textContent = "—";
        if (document.getElementById("risk5"))
          document.getElementById("risk5").textContent = "—";
        saveCKDData();
        risikoBerechnen = false;
      }

      if (egfr >= 61) {
        showPopup(
          "Berechnung nicht möglich",
          "Der Risikokalkulator ist nur für eine eGFR unter 61 ml/min validiert. Eine Schätzung ist daher nicht möglich.",
          "error",
        );
        if (document.getElementById("risk2"))
          document.getElementById("risk2").textContent = "—";
        if (document.getElementById("risk5"))
          document.getElementById("risk5").textContent = "—";
        saveCKDData();
        risikoBerechnen = false;
      }

      const result = kfre(age, selectedGender, egfr, acr);

      if (risikoBerechnen) {
        if (document.getElementById("risk2"))
          document.getElementById("risk2").textContent =
            result.risk2.toFixed(0) + "%";
        if (document.getElementById("risk5"))
          document.getElementById("risk5").textContent =
            result.risk5.toFixed(0) + "%";
        saveCKDData();
      }

      let output = document.getElementById("Resulttext");
      if (!output) return;
      output.innerHTML = "";

      let outputText = "";

      const ckdErgebnis = berechneCKDStadium(egfr, acr);
      const G = ckdErgebnis.G;
      const A = ckdErgebnis.A;
      const risiko = ckdErgebnis.risiko;
      const beschreibung = ckdErgebnis.beschreibung;

      if (selectedGender === 1) {
        outputText +=
          "Der Patient stellte sich zur Beurteilung der Nierenfunktion vor.<br>";
      } else {
        outputText +=
          "Die Patientin stellte sich zur Beurteilung der Nierenfunktion vor.<br>";
      }

      outputText += `
        <p>Folgende Laborwerte wurden zur Verfügung gestellt:</p>
        <ul>
          <li>Kreatinin: ${creatinine} mg/dl</li>
          <li>eGFR (CKD-EPI): ${egfr.toFixed(1)} ml/min/1,73 m²</li>
          <li>UACR: ${acr} mg/g Kreatinin</li>
        </ul>
      `;

      outputText += `
        <p>
          Es liegt eine <strong>${beschreibung}</strong> Nierenfunktion im Stadium
          <strong>${G}${A}</strong> nach KDIGO vor.
        </p>
      `;

      if (egfr > 60) {
        outputText +=
          "<p>Spezifische Nephrologische Maßnahmen sind nicht erforderlich. Eine erneute Vorstellung wird in folgenden Situationen empfohlen: Anstieg des Kreatinins über 2 mg/dl, Entwicklung einer Albuminurie von über 1g/mg Kreatinin.</p>";
      }

      if (risikoBerechnen) {
        if (result.risk5 <= 5) {
          outputText += `<p>Spezifische Nephrologische Maßnahmen sind nicht erforderlich. Eine erneute Vorstellung wird in folgenden Situationen empfohlen: Anstieg des Kreatinins über 2 mg/dl oder Entwicklung einer Albuminurie von über 1 g/mg Kreatinin.</p>`;
        } else if (result.risk5 <= 15) {
          outputText += `<p>Es liegt eine Nierenfunktionsstörung vor. Eine typische CKD-Progression ist zu erwarten. Im Vordergrund steht die Kontrolle der kardiovaskulären Risikofaktoren. Jährliche Kontrollen bei uns sind empfohlen.</p>`;

          if (acr > 30) {
            outputText += `<p>Ein ACE-Hemmer und ein SGLT2-Inhibitor sollten Bestandteil der Therapie sein.</p>`;
          }
        } else if (result.risk5 <= 40 && selectedGender === 1) {
          outputText += `<p>Es liegt eine Nierenfunktionsstörung vor. Der Patient wird in unser Programm bei chronischer Niereninsuffizienz aufgenommen und erweiterte Diagnostik durchgeführt. Wir werden erneut berichten.</p><p>Eine Verlaufskontrolle erfolgt in 6 Monaten.</p>`;
        } else if (result.risk5 > 40 && selectedGender === 1) {
          outputText += `<p>Es liegt eine Nierenfunktionsstörung vor. Der Patient wird in unser Programm bei chronischer Niereninsuffizienz aufgenommen. Wir werden erneut berichten.</p><p>Eine Verlaufskontrolle erfolgt in 3 Monaten.</p>`;
        } else if (result.risk5 <= 40 && selectedGender === 0) {
          outputText += `<p>Es liegt eine Nierenfunktionsstörung vor. Die Patientin wird in unser Programm bei chronischer Niereninsuffizienz aufgenommen und erweiterte Diagnostik durchgeführt. Wir werden erneut berichten.</p><p>Eine Verlaufskontrolle erfolgt in 6 Monaten.</p>`;
        } else if (result.risk5 > 40 && selectedGender === 0) {
          outputText += `<p>Es liegt eine Nierenfunktionsstörung vor. Die Patientin wird in unser Programm bei chronischer Niereninsuffizienz aufgenommen. Wir werden erneut berichten.</p><p>Eine Verlaufskontrolle erfolgt in 3 Monaten.</p>`;
        }
      }

      // Nephro-Anamnese anhängen
      const nephroSummary = getNephroSummary();
      if (nephroSummary) {
        outputText += `<p><strong>Nephrologische Anamnese:</strong></p><p>${nephroSummary}</p>`;
      }

      output.innerHTML = outputText;
    });
  }

  // CKD Inputs automatisch speichern
  const ckdInputIds = ["age", "creatinine", "acr"];
  ckdInputIds.forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", saveCKDData);
    }
  });

  // CKD Daten laden
  loadCKDData();
}

// =========================
// NEPHRO – INITIALISIERUNG
// =========================
function initNephro() {
  const firstCheckbox = document.getElementById("option1");
  if (!firstCheckbox) {
    return;
  }

  function updateNephroVisibility() {
    const option5Checked = document.getElementById("option5")?.checked || false;
    const option6Checked = document.getElementById("option6")?.checked || false;

    const jahrblutContainer = document
      .getElementById("jahrblut")
      ?.closest(".umrechner");
    const option6Container = document
      .getElementById("option6")
      ?.closest(".checkbox-container");
    const obererWertContainer = document
      .getElementById("obererWert")
      ?.closest(".umrechner");

    if (jahrblutContainer) {
      jahrblutContainer.style.display = option5Checked ? "" : "none";
    }

    if (option6Container) {
      option6Container.style.display = option5Checked ? "" : "none";
    }

    if (obererWertContainer) {
      obererWertContainer.style.display =
        option5Checked && option6Checked ? "" : "none";
    }
  }

  function saveNephroData() {
    const data = {
      option1: document.getElementById("option1")?.checked || false,
      option2: document.getElementById("option2")?.checked || false,
      option3: document.getElementById("option3")?.checked || false,
      option4: document.getElementById("option4")?.checked || false,
      option5: document.getElementById("option5")?.checked || false,
      option6: document.getElementById("option6")?.checked || false,
      jahrblut: document.getElementById("jahrblut")?.value || "",
      obererWert: document.getElementById("obererWert")?.value || "",
    };
    localStorage.setItem(NEPHRO_STORAGE_KEY, JSON.stringify(data));
  }

  function loadNephroData() {
    const savedData = localStorage.getItem(NEPHRO_STORAGE_KEY);
    if (!savedData) return;
    const data = JSON.parse(savedData);

    if (document.getElementById("option1"))
      document.getElementById("option1").checked = data.option1 || false;
    if (document.getElementById("option2"))
      document.getElementById("option2").checked = data.option2 || false;
    if (document.getElementById("option3"))
      document.getElementById("option3").checked = data.option3 || false;
    if (document.getElementById("option4"))
      document.getElementById("option4").checked = data.option4 || false;
    if (document.getElementById("option5"))
      document.getElementById("option5").checked = data.option5 || false;
    if (document.getElementById("option6"))
      document.getElementById("option6").checked = data.option6 || false;
    if (document.getElementById("jahrblut"))
      document.getElementById("jahrblut").value = data.jahrblut || "";
    if (document.getElementById("obererWert"))
      document.getElementById("obererWert").value = data.obererWert || "";
  }

  const nephroInputIds = [
    "option1",
    "option2",
    "option3",
    "option4",
    "option5",
    "option6",
    "jahrblut",
    "obererWert",
  ];
  nephroInputIds.forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", saveNephroData);
      input.addEventListener("change", saveNephroData);

      if (id === "option5" || id === "option6") {
        input.addEventListener("change", updateNephroVisibility);
      }
    }
  });

  loadNephroData();
  updateNephroVisibility();
}

// =========================
// ZENTRALE RESET-FUNKTION
// =========================
function resetAllData() {
  // In resetAllData() am Ende einfügen:
  if (document.getElementById("Resulttext"))
    document.getElementById("Resulttext").innerHTML = "";
  if (document.getElementById("CopyBtn"))
    document.getElementById("CopyBtn").style.display = "none";
  // CKD zurücksetzen
  localStorage.removeItem(CKD_STORAGE_KEY);

  if (document.getElementById("age")) document.getElementById("age").value = "";
  if (document.getElementById("creatinine"))
    document.getElementById("creatinine").value = "";
  if (document.getElementById("acr")) document.getElementById("acr").value = "";

  selectedGender = null;
  if (selectedOption) selectedOption.textContent = "Option auswählen";

  if (document.getElementById("egfr-result"))
    document.getElementById("egfr-result").value = "";
  if (document.getElementById("risk2"))
    document.getElementById("risk2").textContent = "—";
  if (document.getElementById("risk5"))
    document.getElementById("risk5").textContent = "—";

  // Nephro zurücksetzen
  localStorage.removeItem(NEPHRO_STORAGE_KEY);

  const nephroCheckboxIds = [
    "option1",
    "option2",
    "option3",
    "option4",
    "option5",
    "option6",
  ];
  nephroCheckboxIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });

  const nephroInputIds = ["jahrblut", "obererWert"];
  nephroInputIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  const jahrblutContainer = document
    .getElementById("jahrblut")
    ?.closest(".umrechner");
  const option6Container = document
    .getElementById("option6")
    ?.closest(".checkbox-container");
  const obererWertContainer = document
    .getElementById("obererWert")
    ?.closest(".umrechner");

  if (jahrblutContainer) jahrblutContainer.style.display = "none";
  if (option6Container) option6Container.style.display = "none";
  if (obererWertContainer) obererWertContainer.style.display = "none";
}

// =========================
// INITIALISIERUNG BEIDER TEILE
// =========================
initCKD();
initNephro();

// Reset-Button registrieren
const resetButton = document.getElementById("resetBtn");
if (resetButton) {
  resetButton.addEventListener("click", resetAllData);
}



// Reset-Button: Copy-Button nach Reset wieder verstecken
const originalReset = resetAllData;
resetAllData = function () {
  originalReset();
  const copyBtn = document.getElementById("CopyBtn");
  if (copyBtn) copyBtn.style.display = "none";
};

// =========================
// COPY BUTTON
// =========================
function initCopyButton() {
  const copyButton = document.getElementById("CopyBtn");
  const resultText = document.getElementById("Resulttext");
  const copyCard = document.getElementById("CopyCard");
  if (!copyButton || !resultText) return;

  // Karte nur anzeigen, wenn ein Ergebnis vorhanden ist
  function updateVisibility() {
    const hasText = resultText.innerText.trim().length > 0;
    if (copyCard) copyCard.style.display = hasText ? "" : "none";
    copyButton.style.display = hasText ? "" : "none";
  }
  new MutationObserver(updateVisibility).observe(resultText, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  updateVisibility();

  copyButton.addEventListener("click", async () => {
    const text = resultText.innerText.trim();

    if (!text) {
      showPopup(
        "Keine Daten",
        "Es sind keine Ergebnisse zum Kopieren vorhanden.",
        "warning",
      );
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      // Kopier-Symbol -> grüner Haken (wie NU)
      copyButton.classList.add("done");
      copyButton.setAttribute("aria-label", "Text wurde kopiert");
      clearTimeout(copyButton._t);
      copyButton._t = setTimeout(() => {
        copyButton.classList.remove("done");
        copyButton.setAttribute("aria-label", "Befund kopieren");
      }, 2000);
    } catch (err) {
      console.error("Copy fehlgeschlagen:", err);
    }
  });
}

initCopyButton();

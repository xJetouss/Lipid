/* SCORE2 / SCORE2-OP für die Lipids-Seite.
   Einbau: ganz unten in der Seite, nach dem großen Skript, ein Script-Tag mit
   src="../score2-befund.js" einfügen (als externe Datei, nicht hineinkopieren).
   Erweitert buildBefund()/renderBefund() und zeigt ein farbiges Risiko-Label im Design der Seite. */
(function () {
  "use strict";

  /* ---------- Modell (ESC 2021) ---------- */
  const C = {
    s2: {
      m: {
        a: 0.3742,
        sm: 0.6012,
        sb: 0.2777,
        tc: 0.1458,
        h: -0.2698,
        sma: -0.0755,
        sba: -0.0255,
        tca: -0.0281,
        ha: 0.0426,
        s0: 0.9605,
      },
      f: {
        a: 0.4648,
        sm: 0.7744,
        sb: 0.3131,
        tc: 0.1002,
        h: -0.2606,
        sma: -0.1088,
        sba: -0.0277,
        tca: -0.0226,
        ha: 0.0613,
        s0: 0.9776,
      },
    },
    op: {
      m: {
        a: 0.0634,
        d: 0.4245,
        sm: 0.3524,
        sb: 0.0094,
        tc: 0.085,
        h: -0.3564,
        da: -0.0174,
        sma: -0.0247,
        sba: -0.0005,
        tca: 0.0073,
        ha: 0.0091,
        s0: 0.7576,
        mean: 0.0929,
      },
      f: {
        a: 0.0789,
        d: 0.601,
        sm: 0.4921,
        sb: 0.0102,
        tc: 0.0605,
        h: -0.304,
        da: -0.0107,
        sma: -0.0255,
        sba: -0.0004,
        tca: -0.0009,
        ha: 0.0154,
        s0: 0.8082,
        mean: 0.229,
      },
    },
  };
  /* Region Deutschland = mittleres Risiko ("moderate") */
  const SCALE = {
    s2: { m: [-0.1565, 0.8009], f: [-0.3143, 0.7701] },
    op: { m: [0.01, 1.25], f: [-0.1, 1.1] },
  };
  const MG_PER_MMOL = 38.67;

  function score2(p) {
    /* p: age, sex 'm'|'f', smoker 0|1, diabetes 0|1, sbp, tcMmol, hdlMmol */
    const op = p.age >= 70,
      c = (op ? C.op : C.s2)[p.sex],
      sm = p.smoker;
    let x;
    if (!op) {
      const a = (p.age - 60) / 5,
        b = (p.sbp - 120) / 20,
        t = p.tcMmol - 6,
        h = (p.hdlMmol - 1.3) / 0.5;
      x =
        c.a * a +
        c.sm * sm +
        c.sb * b +
        c.tc * t +
        c.h * h +
        c.sma * sm * a +
        c.sba * b * a +
        c.tca * t * a +
        c.ha * h * a;
    } else {
      const a = p.age - 73,
        b = p.sbp - 150,
        t = p.tcMmol - 6,
        h = p.hdlMmol - 1.4,
        d = p.diabetes;
      x =
        c.a * a +
        c.d * d +
        c.sm * sm +
        c.sb * b +
        c.tc * t +
        c.h * h +
        c.da * d * a +
        c.sma * sm * a +
        c.sba * b * a +
        c.tca * t * a +
        c.ha * h * a -
        c.mean;
    }
    const r0 = 1 - Math.pow(c.s0, Math.exp(x));
    const [s1, s2] = SCALE[op ? "op" : "s2"][p.sex];
    const pct =
      (1 - Math.exp(-Math.exp(s1 + s2 * Math.log(-Math.log(1 - r0))))) * 100;
    const shown = Math.round(pct * 10) / 10;
    const [lo, vh] = p.age < 50 ? [2.5, 7.5] : p.age < 70 ? [5, 10] : [7.5, 15];
    return {
      model: op ? "SCORE2-OP" : "SCORE2",
      shown,
      lo,
      vh,
      level: shown < lo ? "low" : shown < vh ? "high" : "vhigh",
    };
  }
  const de = (n, d) =>
    Number(n)
      .toFixed(d === undefined ? 1 : d)
      .replace(".", ",");
  const LEVEL = {
    low: "niedriges bis moderates Risiko",
    high: "hohes Risiko",
    vhigh: "sehr hohes Risiko",
  };

  if (typeof module !== "undefined" && module.exports)
    module.exports = { score2 };
  if (typeof document === "undefined") return;

  /* ---------- Eingaben lesen ---------- */
  const $ = (id) => document.getElementById(id);
  const ls = (k) =>
    parseFloat(String(localStorage.getItem(k) || "").replace(",", "."));

  /* Liefert { ok:true, ... } oder { ok:false, reason } (reason = "" → gar nichts anzeigen) */
  function scoreInfo() {
    const ageReal = parseInt($("alter") ? $("alter").value : "", 10);
    const sex = { m: "m", w: "f" }[
      $("geschlecht") ? $("geschlecht").value : ""
    ];
    const cigRaw = $("zigaretten") ? $("zigaretten").value.trim() : "";
    const sbpM = String($("blutdruck") ? $("blutdruck").value : "").match(
      /\d+/,
    );
    const sbp = sbpM ? parseFloat(sbpM[0]) : NaN;
    const tc = ls("9Input"),
      hdl = ls("7Input"),
      hba = ls("19Input");

    if (!isFinite(ageReal)) {
      const m = ["Geburtsdatum"];
      if (!sex) m.push("Geschlecht");
      if (!isFinite(sbp)) m.push("Blutdruck");
      if (!isFinite(tc)) m.push("Gesamtcholesterin");
      if (!isFinite(hdl)) m.push("HDL-C");
      return { ok: false, reason: "SCORE2: es fehlt noch " + m.join(", ") };
    }
    if (ageReal < 35 || ageReal > 89)
      return {
        ok: false,
        reason:
          "SCORE2: nur für 35–89 Jahre berechenbar (aktuell " +
          ageReal +
          " Jahre)",
      };

    const missing = [];
    if (!sex)
      missing.push(
        $("geschlecht") && $("geschlecht").value === "d"
          ? "Geschlecht m/w (divers nicht möglich)"
          : "Geschlecht",
      );
    if (!isFinite(sbp)) missing.push("Blutdruck");
    if (!isFinite(tc)) missing.push("Gesamtcholesterin");
    if (!isFinite(hdl)) missing.push("HDL-C");
    if (missing.length)
      return {
        ok: false,
        reason: "SCORE2: es fehlt noch " + missing.join(", "),
      };

    const assumed = ageReal < 40; /* 35–39 → Alter 40 annehmen */
    const age = assumed ? 40 : ageReal;
    const tcMmol = tc / MG_PER_MMOL,
      hdlMmol = hdl / MG_PER_MMOL;
    if (
      tcMmol < 1.3 ||
      tcMmol > 10.3 ||
      hdlMmol < 0.26 ||
      hdlMmol > 3.88 ||
      sbp < 50 ||
      sbp > 300
    )
      return {
        ok: false,
        reason: "SCORE2: ein Wert liegt außerhalb des Berechnungsbereichs",
      };

    const diabetes =
      isFinite(hba) && hba >= 6.5 ? 1 : 0; /* HbA1c ≥ 6,5 % → Diabetes */
    if (diabetes && age < 70)
      return {
        ok: false,
        reason: "SCORE2 gilt nicht bei Diabetes (HbA1c ≥ 6,5 %)",
      };

    const smoker =
      Number(cigRaw.replace(",", ".")) > 0 ? 1 : 0; /* leer = 0 Zigaretten */
    const res = score2({ age, sex, smoker, diabetes, sbp, tcMmol, hdlMmol });
    return Object.assign(res, {
      ok: true,
      age,
      ageReal,
      assumed,
      sex,
      smoker,
      diabetes,
      sbp,
      tc,
      hdl,
    });
  }

  function scoreText() {
    const s = scoreInfo();
    if (!s.ok) return "";
    let t = "";
    if (s.assumed)
      t +=
        "Für die Berechnung wurde ein Alter von 40 Jahren angenommen. Das tatsächliche Alter beträgt " +
        s.ageReal +
        " Jahre.\n\n";
    t +=
      "Das Risiko für einen Herzinfarkt oder Schlaganfall in den nächsten 10 Jahren beträgt nach dem Rechner " +
      s.model +
      " für Deutschland " +
      de(s.shown) +
      " %. Das entspricht einem " +
      LEVEL[s.level] +
      ". Die Grenzen für diese Altersgruppe liegen bei " +
      de(s.lo) +
      " % und " +
      de(s.vh) +
      " %.\n" +
      "Berücksichtigte Werte: " +
      (s.sex === "m" ? "männlich" : "weiblich") +
      ", " +
      s.age +
      " Jahre, " +
      (s.smoker ? "Raucher" : "Nichtraucher") +
      ", oberer Blutdruckwert " +
      s.sbp +
      " mmHg, Gesamtcholesterin " +
      de(s.tc, 0) +
      " mg/dl, HDL-Cholesterin " +
      de(s.hdl, 0) +
      " mg/dl" +
      (s.diabetes ? ", Diabetes" : "") +
      ".";
    return t;
  }

  /* ---------- Befundtext + Risiko-Label ---------- */
  const origBuild = window.buildBefund,
    origRender = window.renderBefund;
  window.buildBefund = function () {
    const base = typeof origBuild === "function" ? origBuild() : "";
    let add = "";
    try {
      add = scoreText();
    } catch (e) {
      console.error("SCORE2:", e);
    }
    return add ? base + "\n\n" + add : base;
  };
  window.renderBefund = function () {
    if (typeof origRender === "function") origRender();
    else if ($("out")) $("out").textContent = window.buildBefund();
    const chip = $("scoreChip");
    if (!chip) return;
    try {
      const s = scoreInfo();
      if (s.ok) {
        chip.hidden = false;
        chip.dataset.level = s.level;
        chip.textContent =
          s.model + " · " + de(s.shown) + " % · " + LEVEL[s.level];
      } else if (s.reason) {
        chip.hidden = false;
        chip.dataset.level = "info";
        chip.textContent = s.reason;
      } else chip.hidden = true;
    } catch (e) {
      chip.hidden = true;
      console.error("SCORE2:", e);
    }
  };

  /* ---------- Design (Stil der Seite) ---------- */
  const st = document.createElement("style");
  st.textContent =
    ".score-chip{display:inline-flex;align-items:center;margin:0 0 14px;padding:9px 18px;border-radius:999px;font-size:.95rem;font-weight:600;letter-spacing:.2px;border:1px solid transparent;transition:background .25s,color .25s}" +
    ".score-chip[hidden]{display:none}" +
    ".score-chip[data-level=low]{background:rgba(28,138,58,.12);color:#1c8a3a;border-color:rgba(28,138,58,.25)}" +
    ".score-chip[data-level=high]{background:rgba(240,168,0,.16);color:#8a5a00;border-color:rgba(240,168,0,.35)}" +
    ".score-chip[data-level=info]{background:rgba(120,130,140,.12);color:#5a6572;border-color:rgba(120,130,140,.25);font-weight:500}" +
    ".score-chip[data-level=vhigh]{background:rgba(229,55,43,.12);color:#b3261e;border-color:rgba(229,55,43,.3)}" +
    "@media (max-width:650px){.score-chip{font-size:.9rem;padding:8px 14px}}";
  document.head.appendChild(st);

  const card = document.querySelector(".out-card"),
    row = document.querySelector(".outrow");
  if (card && row) {
    const chip = document.createElement("div");
    chip.id = "scoreChip";
    chip.className = "score-chip";
    chip.hidden = true;
    chip.setAttribute("role", "status");
    card.insertBefore(chip, row);
  }

  /* Live-Update; setTimeout, damit das Alter (updateAlter) zuerst aktualisiert ist */
  const refresh = () => setTimeout(() => window.renderBefund(), 0);
  ["datum", "geburtsdatum", "geschlecht", "zigaretten", "blutdruck"].forEach(
    (id) => {
      const el = $(id);
      if (!el) return;
      ["input", "change", "keyup"].forEach((ev) =>
        el.addEventListener(ev, refresh),
      );
    },
  );
  /* Falls die Seite beim Laden schon Werte wiederherstellt */
  document.addEventListener("DOMContentLoaded", () => setTimeout(refresh, 150));
  window.addEventListener("load", refresh);
  if (document.readyState !== "loading") refresh();
})();

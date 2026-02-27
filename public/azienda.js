// Estrai CIK dall'URL: /azienda/320193 → "320193"
const cik = window.location.pathname.split("/").pop();

// Stato del toggle: "annuale" o "trimestrale"
let modalita = "annuale";

// Dati grezzi salvati globalmente per il toggle
let datiGrezzi = null;

// ─── Avvio ───────────────────────────────────────────────
caricaDettaglio();
caricaFinanziari();

// ─── Dettaglio azienda ───────────────────────────────────
async function caricaDettaglio() {
  const response = await fetch(`/api/azienda/${cik}`);
  const data = await response.json();

  document.getElementById("nome").textContent = data.name || "N/D";
  document.getElementById("settore").textContent = data.sic || "N/D";
  document.getElementById("borsa").textContent =
    data.exchanges?.join(", ") || "N/D";
  document.getElementById("stato").textContent =
    data.stateOfIncorporation || "N/D";

  const tickerContainer = document.getElementById("tickers");
  (data.tickers || []).forEach(function (ticker) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = ticker;
    tickerContainer.appendChild(badge);
  });
}

// ─── Dati finanziari ─────────────────────────────────────
async function caricaFinanziari() {
  const response = await fetch(`/api/azienda/${cik}/finanziari`);
  datiGrezzi = await response.json();
  renderTabelle();
}

// ─── Render tabelle in base alla modalità ────────────────
function renderTabelle() {
  if (!datiGrezzi) return;

  const isAnnuale = modalita === "annuale";

  const ricavi = isAnnuale
    ? filtraAnnuali(datiGrezzi.ricavi)
    : filtraTrimestrali(datiGrezzi.ricavi);
  const utile = isAnnuale
    ? filtraAnnuali(datiGrezzi.utile)
    : filtraTrimestrali(datiGrezzi.utile);
  const assets = isAnnuale
    ? filtraAnnuali(datiGrezzi.assets)
    : filtraTrimestrali(datiGrezzi.assets);
  const patrimonio = isAnnuale
    ? filtraAnnuali(datiGrezzi.patrimonioNetto)
    : filtraTrimestrali(datiGrezzi.patrimonioNetto);
  const cfOperativo = isAnnuale
    ? filtraAnnuali(datiGrezzi.cashFlowOperativo)
    : filtraTrimestrali(datiGrezzi.cashFlowOperativo);
  const capex = isAnnuale
    ? filtraAnnuali(datiGrezzi.capex)
    : filtraTrimestrali(datiGrezzi.capex);

  // Calcola Free Cash Flow: OCF - CapEx
  const fcf = calcolaFCF(cfOperativo, capex);

  // Calcola ROE: NetIncome / PatrimonioNetto * 100
  const roe = calcolaRatio(utile, patrimonio);

  // Calcola ROI: NetIncome / Assets * 100
  const roi = calcolaRatio(utile, assets);

  // Render ogni tabella
  renderTabella("tabella-ricavi", ricavi, isAnnuale, "Ricavi", formatMiliardi);
  renderTabella(
    "tabella-utile",
    utile,
    isAnnuale,
    "Utile Netto",
    formatMiliardi,
  );
  renderTabella(
    "tabella-cf",
    cfOperativo,
    isAnnuale,
    "Cash Flow Operativo",
    formatMiliardi,
  );
  renderTabella(
    "tabella-fcf",
    fcf,
    isAnnuale,
    "Free Cash Flow",
    formatMiliardi,
  );
  renderTabella("tabella-roe", roe, isAnnuale, "ROE", formatPercentuale);
  renderTabella("tabella-roi", roi, isAnnuale, "ROI", formatPercentuale);
}

// ─── Filtraggio annuale (10-K) ───────────────────────────
function filtraAnnuali(voci) {
  if (!voci || voci.length === 0) return [];

  const anniVisti = new Set();

  return voci
    .filter((v) => v.form === "10-K")
    .filter((v) => {
      const anno = v.fy || new Date(v.end).getFullYear();
      if (anniVisti.has(anno)) return false;
      anniVisti.add(anno);
      return true;
    })
    .sort((a, b) => new Date(a.end) - new Date(b.end))
    .slice(-6); // ultimi 6 anni
}

// ─── Filtraggio trimestrale (10-Q) ───────────────────────
function filtraTrimestrali(voci) {
  if (!voci || voci.length === 0) return [];

  const chiavi = new Set();

  return voci
    .filter((v) => v.form === "10-Q")
    .filter((v) => {
      // Chiave unica: anno fiscale + periodo (Q1, Q2, Q3)
      const chiave = `${v.fy}-${v.fp}`;
      if (chiavi.has(chiave)) return false;
      chiavi.add(chiave);
      return true;
    })
    .sort((a, b) => new Date(a.end) - new Date(b.end))
    .slice(-8); // ultimi 8 trimestri
}

// ─── Calcolo Free Cash Flow ──────────────────────────────
function calcolaFCF(cfOperativo, capex) {
  return cfOperativo.map(function (cf) {
    // Trova il CapEx dello stesso periodo
    const capexPeriodo = capex.find(
      (c) => c.end === cf.end && c.form === cf.form,
    );
    if (!capexPeriodo) return { ...cf, val: null };
    // CapEx in EDGAR è positivo (uscita di cassa), FCF = OCF - CapEx
    return { ...cf, val: cf.val - capexPeriodo.val };
  });
}

// ─── Calcolo ratio (ROE, ROI) ────────────────────────────
function calcolaRatio(numeratore, denominatore) {
  return numeratore.map(function (num) {
    const den = denominatore.find(
      (d) => d.end === num.end && d.form === num.form,
    );
    if (!den || den.val === 0) return { ...num, val: null };
    return { ...num, val: (num.val / den.val) * 100 };
  });
}

// ─── Render singola tabella ──────────────────────────────
function renderTabella(id, dati, isAnnuale, titolo, formattatore) {
  const container = document.getElementById(id);

  if (!dati || dati.length === 0) {
    container.innerHTML = `<p class="nd">Dati non disponibili</p>`;
    return;
  }

  const labelPeriodo = isAnnuale ? "Anno" : "Trimestre";

  const righe = dati
    .map(function (voce) {
      const periodo = isAnnuale
        ? voce.fy || new Date(voce.end).getFullYear()
        : `${voce.fy} ${voce.fp}`;

      const valore =
        voce.val === null || voce.val === undefined
          ? "N/D"
          : formattatore(voce.val);

      return `<tr><td>${periodo}</td><td>${valore}</td></tr>`;
    })
    .join("");

  container.innerHTML = `
    <table>
      <thead><tr><th>${labelPeriodo}</th><th>${titolo}</th></tr></thead>
      <tbody>${righe}</tbody>
    </table>
  `;
}

// ─── Formattatori ────────────────────────────────────────
function formatMiliardi(val) {
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + "B";
  if (abs >= 1_000_000) return (val / 1_000_000).toFixed(2) + "M";
  return val.toLocaleString();
}

function formatPercentuale(val) {
  return val.toFixed(2) + "%";
}

// ─── Toggle annuale/trimestrale ──────────────────────────
document
  .getElementById("toggle-annuale")
  .addEventListener("click", function () {
    modalita = "annuale";
    document.getElementById("toggle-annuale").classList.add("attivo");
    document.getElementById("toggle-trimestrale").classList.remove("attivo");
    renderTabelle();
  });

document
  .getElementById("toggle-trimestrale")
  .addEventListener("click", function () {
    modalita = "trimestrale";
    document.getElementById("toggle-trimestrale").classList.add("attivo");
    document.getElementById("toggle-annuale").classList.remove("attivo");
    renderTabelle();
  });

// job-screener.js
// Popola la tabella net_cash_screener su Supabase
// Uso: node job-screener.js
// Rate: 5 req/sec per rispettare i limiti EDGAR

const https = require("https");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Variabili SUPABASE_URL e SUPABASE_KEY mancanti");
  process.exit(1);
}

// ─── Helper HTTP ──────────────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: { "User-Agent": "edgar-dashboard giorgiobenetti@gmail.com" },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Parse error: " + data.substring(0, 100)));
          }
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

// ─── Helper Supabase ──────────────────────────────────────
function supabaseUpsert(rows) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(rows);
    const url = new URL(`${SUPABASE_URL}/rest/v1/net_cash_screener`);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "resolution=merge-duplicates",
      },
    };
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ─── Estrai valore più recente da un tag EDGAR ────────────
function estraiValore(facts, ...tags) {
  const usGaap = facts?.facts?.["us-gaap"] || {};
  for (const tag of tags) {
    const serie = usGaap[tag]?.units?.USD || usGaap[tag]?.units?.shares || [];
    // Prendi l'ultimo valore da 10-K
    const annuali = serie
      .filter((v) => v.form === "10-K" && v.val !== undefined)
      .sort((a, b) => new Date(b.end) - new Date(a.end));
    if (annuali.length > 0) return annuali[0].val;
  }
  return null;
}

function estraiShares(facts) {
  const usGaap = facts?.facts?.["us-gaap"] || {};
  const dei = facts?.facts?.["dei"] || {};

  // Prova prima DEI (Document and Entity Information)
  const deiTags = ["EntityCommonStockSharesOutstanding"];
  for (const tag of deiTags) {
    const serie = dei[tag]?.units?.shares || [];
    const recenti = serie.sort((a, b) => new Date(b.end) - new Date(a.end));
    if (recenti.length > 0) return recenti[0].val;
  }

  // Fallback su us-gaap
  return estraiValore(
    facts,
    "CommonStockSharesOutstanding",
    "CommonStockSharesIssued",
  );
}

// ─── Pausa ────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  console.log("🚀 Avvio job screener EDGAR → Supabase");
  console.log("📅 " + new Date().toISOString());

  // 1. Scarica lista aziende
  console.log("\n📋 Scarico lista aziende da EDGAR...");
  const companies = await fetchJSON(
    "https://www.sec.gov/files/company_tickers.json",
  );
  const lista = Object.values(companies);
  console.log(`✅ ${lista.length} aziende trovate`);

  let processate = 0;
  let salvate = 0;
  let errori = 0;
  let batch = [];

  for (const company of lista) {
    const cik = String(company.cik_str).padStart(10, "0");
    const ticker = company.ticker || "";
    const nome = company.title || "";

    try {
      const facts = await fetchJSON(
        `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
      );

      // Estrai valori
      const cash = estraiValore(
        facts,
        "CashAndCashEquivalentsAtCarryingValue",
        "CashAndCashEquivalents",
        "Cash",
      );

      const debt_lt = estraiValore(
        facts,
        "LongTermDebt",
        "LongTermDebtNoncurrent",
        "LongTermNotesPayable",
      );

      const debt_st = estraiValore(
        facts,
        "ShortTermBorrowings",
        "CommercialPaper",
        "NotesPayableCurrent",
        "ShortTermDebt",
      );

      const shares = estraiShares(facts);

      // Calcola net cash
      const debtTotale = (debt_lt || 0) + (debt_st || 0);
      const net_cash = cash !== null ? cash - debtTotale : null;
      const net_cash_per_share =
        net_cash !== null && shares ? net_cash / shares : null;

      if (cash !== null && shares) {
        batch.push({
          ticker,
          cik,
          nome,
          cash,
          debt_lt: debt_lt || 0,
          debt_st: debt_st || 0,
          net_cash,
          shares_outstanding: shares,
          net_cash_per_share,
          ultimo_aggiornamento: new Date().toISOString(),
        });
        salvate++;
      }

      processate++;

      // Salva batch ogni 50 aziende
      if (batch.length >= 50) {
        const result = await supabaseUpsert(batch);
        console.log(
          `💾 Salvate ${salvate} aziende (ultimo batch: ${result.status}) — ${processate}/${lista.length} processate`,
        );
        batch = [];
      }
    } catch (err) {
      errori++;
      if (errori % 100 === 0)
        console.log(
          `⚠️  ${errori} errori finora (normale per aziende senza dati)`,
        );
    }

    // Rate limiting: 5 req/sec
    await sleep(200);
  }

  // Salva batch finale
  if (batch.length > 0) {
    await supabaseUpsert(batch);
    console.log(`💾 Batch finale salvato`);
  }

  console.log(`\n✅ Job completato!`);
  console.log(`   Processate: ${processate}`);
  console.log(`   Salvate:    ${salvate}`);
  console.log(`   Errori:     ${errori}`);
}

main().catch((err) => {
  console.error("❌ Errore fatale:", err);
  process.exit(1);
});

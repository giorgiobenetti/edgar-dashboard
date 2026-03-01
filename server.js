const express = require("express");
const edgar = require("./edgar");

const app = express();

app.use(express.static("public"));

app.get("/aziende", function (req, res) {
  edgar.getAziende(function (err, data) {
    if (err) {
      res.status(500).json({ errore: "Errore nella chiamata a EDGAR" });
      return;
    }
    res.json(data);
  });
});

app.get("/api/azienda/:cik", function (req, res) {
  const cik = req.params.cik;
  edgar.getDettaglioAzienda(cik, function (err, data) {
    if (err) {
      res.status(500).json({ errore: "Errore nel caricamento del dettaglio" });
      return;
    }
    res.json(data);
  });
});

app.get("/azienda/:cik", function (req, res) {
  res.sendFile(__dirname + "/public/azienda.html");
});

app.get("/api/azienda/:cik/finanziari", function (req, res) {
  const cik = req.params.cik;
  edgar.getDatiFinanziari(cik, function (err, data) {
    if (err) {
      res
        .status(500)
        .json({ errore: "Errore nel caricamento dei dati finanziari" });
      return;
    }
    res.json(data);
  });
});

// ─── Risolve ticker → CIK ────────────────────────────────
app.get("/api/ticker/:ticker", function (req, res) {
  const ticker = req.params.ticker.toUpperCase();
  edgar.getAziende(function (err, data) {
    if (err) {
      res.status(500).json({ errore: "Errore nella ricerca ticker" });
      return;
    }
    const found = Object.values(data).find(
      (a) => (a.ticker || "").toUpperCase() === ticker,
    );
    if (!found) {
      res.status(404).json({ errore: `Ticker ${ticker} non trovato` });
      return;
    }
    res.json({
      cik: String(found.cik_str).padStart(10, "0"),
      name: found.title,
      ticker: found.ticker,
    });
  });
});

// ─── Debug: ultimi 5 record di un tag specifico ──────────
app.get("/api/edgar/debug/:cik/:tag", function (req, res) {
  const cik = String(req.params.cik).padStart(10, "0");
  const tag = req.params.tag;
  edgar.getCompanyFacts(cik, function (err, data) {
    if (err) {
      res.status(500).json({ errore: err.message });
      return;
    }
    const usGaap = data.facts["us-gaap"] || {};
    const serie = usGaap[tag]?.units?.USD || [];
    const annuali = serie.filter((v) => v.form === "10-K").slice(-3);
    const trimestrali = serie.filter((v) => v.form === "10-Q").slice(-3);
    res.json({ tag, totale: serie.length, annuali, trimestrali });
  });
});

// ─── Debug: lista tag us-gaap disponibili ────────────────
app.get("/api/edgar/tags/:cik", function (req, res) {
  const cik = String(req.params.cik).padStart(10, "0");
  edgar.getCompanyFacts(cik, function (err, data) {
    if (err) {
      res.status(500).json({ errore: err.message });
      return;
    }
    const usGaap = data.facts["us-gaap"] || {};
    const tags = Object.keys(usGaap).sort();
    // Filtra solo i tag che potrebbero essere ricavi/utile/cash
    const keywords = [
      "revenue",
      "income",
      "cash",
      "profit",
      "earning",
      "sales",
      "loss",
      "flow",
    ];
    const rilevanti = tags.filter((t) =>
      keywords.some((k) => t.toLowerCase().includes(k)),
    );
    res.json({ tutti: tags.length, rilevanti });
  });
});

app.get("/api/edgar/facts/:cik", function (req, res) {
  const cik = String(req.params.cik).padStart(10, "0");
  edgar.getCompanyFacts(cik, function (err, data) {
    if (err) {
      res.status(500).json({ errore: "Errore nel caricamento facts EDGAR" });
      return;
    }
    res.json(data);
  });
});

// ─── Proxy Finnhub ────────────────────────────────────────
const FINNHUB_KEY =
  process.env.FINNHUB_KEY || "d6i8o69r01ql9cifcopgd6i8o69r01ql9cifcoq0";

app.get("/api/finnhub/profile/:ticker", function (req, res) {
  const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${req.params.ticker}&token=${FINNHUB_KEY}`;
  fetchJSON(url, res);
});

app.get("/api/finnhub/financials/:ticker", function (req, res) {
  const { statement, freq } = req.query;
  const url = `https://finnhub.io/api/v1/financials?symbol=${req.params.ticker}&statement=${statement}&freq=${freq}&token=${FINNHUB_KEY}`;
  fetchJSON(url, res);
});

// Debug: mostra risposta grezza Finnhub
app.get("/api/finnhub/debug/:ticker", function (req, res) {
  const url = `https://finnhub.io/api/v1/financials?symbol=${req.params.ticker}&statement=ic&freq=annual&token=${FINNHUB_KEY}`;
  const https = require("https");
  https
    .get(
      url,
      { headers: { "User-Agent": "edgar-dashboard giorgiobenetti@gmail.com" } },
      function (r) {
        let data = "";
        r.on("data", (c) => (data += c));
        r.on("end", () => res.send(`Status: ${r.statusCode}\nBody: ${data}`));
      },
    )
    .on("error", (e) => res.send("Error: " + e.message));
});

function fetchJSON(url, res) {
  const https = require("https");
  https
    .get(
      url,
      { headers: { "User-Agent": "edgar-dashboard giorgiobenetti@gmail.com" } },
      function (r) {
        let data = "";
        r.on("data", (c) => (data += c));
        r.on("end", () => {
          try {
            res.json(JSON.parse(data));
          } catch (e) {
            res
              .status(500)
              .json({
                errore: "Parse error",
                status: r.statusCode,
                raw: data.substring(0, 300),
              });
          }
        });
      },
    )
    .on("error", (e) => res.status(500).json({ errore: e.message }));
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log("Server avviato su porta " + PORT);
});

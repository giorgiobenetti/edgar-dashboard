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

// ─── Scarica company facts EDGAR ─────────────────────────
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log("Server avviato su porta " + PORT);
});

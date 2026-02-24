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

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log("Server avviato su porta " + PORT);
});

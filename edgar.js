const https = require("https");

function getAziende(callback) {
  const options = {
    hostname: "www.sec.gov",
    path: "/files/company_tickers.json",
    method: "GET",
    headers: {
      "User-Agent": "edgar-dashboard giorgiobenetti@gmail.com",
      Accept: "application/json",
    },
  };

  const request = https.request(options, function (response) {
    let data = "";

    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function () {
      const aziende = JSON.parse(data);
      callback(null, aziende);
    });
  });

  request.on("error", function (err) {
    callback(err, null);
  });

  request.end();
}

function getDettaglioAzienda(cik, callback) {
  const cikPadded = String(cik).padStart(10, "0");

  const options = {
    hostname: "data.sec.gov",
    path: `/submissions/CIK${cikPadded}.json`,
    method: "GET",
    headers: {
      "User-Agent": "edgar-dashboard giorgiobenetti@gmail.com",
      Accept: "application/json",
    },
  };

  const request = https.request(options, function (response) {
    let data = "";

    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function () {
      const dettaglio = JSON.parse(data);
      callback(null, dettaglio);
    });
  });

  request.on("error", function (err) {
    callback(err, null);
  });

  request.end();
}

function getDatiFinanziari(cik, callback) {
  const cikPadded = String(cik).padStart(10, "0");

  const options = {
    hostname: "data.sec.gov",
    path: `/api/xbrl/companyfacts/CIK${cikPadded}.json`,
    method: "GET",
    headers: {
      "User-Agent": "edgar-dashboard giorgiobenetti@gmail.com",
      Accept: "application/json",
    },
  };

  const request = https.request(options, function (response) {
    let data = "";

    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function () {
      const facts = JSON.parse(data);
      const usGaap = facts.facts["us-gaap"];

      // Ricavi - prova tag alternativi
      const ricavi =
        usGaap?.Revenues?.units?.USD ||
        usGaap?.RevenueFromContractWithCustomerExcludingAssessedTax?.units
          ?.USD ||
        usGaap?.SalesRevenueNet?.units?.USD ||
        [];

      // Utile netto
      const utile = usGaap?.NetIncomeLoss?.units?.USD || [];

      // Assets totali
      const assets = usGaap?.Assets?.units?.USD || [];

      // Patrimonio netto (per ROE)
      const patrimonioNetto =
        usGaap?.StockholdersEquity?.units?.USD ||
        usGaap
          ?.StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest
          ?.units?.USD ||
        [];

      // Cash flow operativo
      const cashFlowOperativo =
        usGaap?.NetCashProvidedByUsedInOperatingActivities?.units?.USD || [];

      // CapEx (spese in conto capitale)
      const capex =
        usGaap?.PaymentsToAcquirePropertyPlantAndEquipment?.units?.USD || [];

      callback(null, {
        ricavi,
        utile,
        assets,
        patrimonioNetto,
        cashFlowOperativo,
        capex,
      });
    });
  });

  request.on("error", function (err) {
    callback(err, null);
  });

  request.end();
}

// ─── Company facts completi (per financial-check-edgar) ──
function getCompanyFacts(cik, callback) {
  const cikPadded = String(cik).padStart(10, "0");

  const options = {
    hostname: "data.sec.gov",
    path: `/api/xbrl/companyfacts/CIK${cikPadded}.json`,
    method: "GET",
    headers: {
      "User-Agent": "edgar-dashboard giorgiobenetti@gmail.com",
      Accept: "application/json",
    },
  };

  const request = https.request(options, function (response) {
    let data = "";
    response.on("data", function (chunk) {
      data += chunk;
    });
    response.on("end", function () {
      try {
        const facts = JSON.parse(data);
        callback(null, facts);
      } catch (e) {
        callback(e, null);
      }
    });
  });

  request.on("error", function (err) {
    callback(err, null);
  });
  request.end();
}

module.exports = {
  getAziende,
  getDettaglioAzienda,
  getDatiFinanziari,
  getCompanyFacts,
};

const cik = window.location.pathname.split("/").pop();

async function caricaDettaglio() {
  try {
    const response = await fetch(`/api/azienda/${cik}`);
    const data = await response.json();

    document.getElementById("nome").textContent = data.name;
    document.getElementById("settore").textContent =
      data.sicDescription || "N/D";
    document.getElementById("borsa").textContent = data.exchanges
      ? data.exchanges.join(", ")
      : "N/D";
    document.getElementById("cik").textContent = data.cik;
    document.getElementById("stato").textContent =
      data.stateOfIncorporation || "N/D";

    const tickersDiv = document.getElementById("tickers");
    if (data.tickers) {
      data.tickers.forEach(function (t) {
        const span = document.createElement("span");
        span.className = "ticker";
        span.textContent = t;
        tickersDiv.appendChild(span);
      });
    }

    document.getElementById("loading").style.display = "none";
    document.getElementById("contenuto").style.display = "block";

    caricaFinanziari();
  } catch (err) {
    document.getElementById("loading").textContent = "Errore nel caricamento.";
  }
}

function filtraAnnuali(voci) {
  return voci
    .filter((v) => v.form === "10-K")
    .sort((a, b) => new Date(b.end) - new Date(a.end))
    .slice(0, 5)
    .reverse();
}

function formatMiliardi(valore) {
  return (valore / 1_000_000_000).toFixed(1) + "B";
}

async function caricaFinanziari() {
  try {
    const response = await fetch(`/api/azienda/${cik}/finanziari`);
    const data = await response.json();

    const ricavi = filtraAnnuali(data.ricavi);
    const utile = filtraAnnuali(data.utile);
    const assets = filtraAnnuali(data.assets);

    const sezione = document.getElementById("finanziari");

    let html = "<h2>Dati Finanziari</h2><table>";
    html +=
      "<thead><tr><th>Anno</th><th>Ricavi</th><th>Utile Netto</th><th>Assets Totali</th></tr></thead>";
    html += "<tbody>";

    ricavi.forEach(function (r, i) {
      const anno = r.end.substring(0, 4);
      const ricavo = formatMiliardi(r.val);
      const ut = utile[i] ? formatMiliardi(utile[i].val) : "N/D";
      const ast = assets[i] ? formatMiliardi(assets[i].val) : "N/D";
      html += `<tr><td>${anno}</td><td>${ricavo}</td><td>${ut}</td><td>${ast}</td></tr>`;
    });

    html += "</tbody></table>";
    sezione.innerHTML = html;
  } catch (err) {
    document.getElementById("finanziari").textContent =
      "Dati finanziari non disponibili.";
  }
}

caricaDettaglio();

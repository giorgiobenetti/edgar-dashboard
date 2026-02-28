let tutteLeAziende = [];
let aziendeFiltrate = [];
let paginaCorrente = 1;
const aziendePerPagina = 50;

async function caricaAziende() {
  try {
    const response = await fetch("/aziende");
    const data = await response.json();
    tutteLeAziende = Object.values(data);
    aziendeFiltrate = tutteLeAziende;
    mostraPagina(1);
  } catch (err) {
    console.error("Errore nel caricamento:", err);
  }
}

caricaAziende();

document.getElementById("ricerca").addEventListener("input", function () {
  const testo = this.value.toLowerCase();
  aziendeFiltrate = tutteLeAziende.filter(function (azienda) {
    return (
      azienda.title.toLowerCase().includes(testo) ||
      azienda.ticker.toLowerCase().includes(testo)
    );
  });
  mostraPagina(1);
});

document
  .getElementById("btn-precedente")
  .addEventListener("click", function () {
    if (paginaCorrente > 1) mostraPagina(paginaCorrente - 1);
  });

document
  .getElementById("btn-successivo")
  .addEventListener("click", function () {
    const totalePagine = Math.ceil(aziendeFiltrate.length / aziendePerPagina);
    if (paginaCorrente < totalePagine) mostraPagina(paginaCorrente + 1);
  });

function mostraPagina(pagina) {
  paginaCorrente = pagina;
  const inizio = (pagina - 1) * aziendePerPagina;
  const fine = inizio + aziendePerPagina;
  const aziendeDaMostrare = aziendeFiltrate.slice(inizio, fine);

  const tbody = document.getElementById("tabella");
  tbody.innerHTML = "";

  aziendeDaMostrare.forEach(function (azienda) {
    const riga = document.createElement("tr");
    riga.innerHTML = `
      <td><a href="/azienda/${azienda.cik_str}">${azienda.title}</a></td>
      <td class="ticker-cell">${azienda.ticker}</td>
      <td class="cik-cell">${azienda.cik_str}</td>
    `;
    tbody.appendChild(riga);
  });

  const totalePagine = Math.ceil(aziendeFiltrate.length / aziendePerPagina);
  document.getElementById("info-pagina").textContent =
    `Pagina ${pagina} di ${totalePagine} — ${aziendeFiltrate.length} aziende`;
  document.getElementById("btn-precedente").disabled = pagina === 1;
  document.getElementById("btn-successivo").disabled = pagina === totalePagine;
}

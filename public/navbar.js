<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <title>Edgar Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600&display=swap" rel="stylesheet" />
    <style>
      :root {
        --bg: #0a0e17; --surface: #111827; --surface2: #1a2235;
        --border: #1f2d45; --accent: #00d4ff; --green: #10b981;
        --text: #e2e8f0; --text-dim: #64748b; --text-muted: #334155;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: "IBM Plex Sans", sans-serif;
        background: var(--bg);
        color: var(--text);
        min-height: 100vh;
        padding: 32px 24px;
        max-width: 1200px;
        margin: 0 auto;
      }
      h1 { font-size: 32px; font-weight: 300; letter-spacing: -0.02em; margin-bottom: 4px; }
      h1 span { color: var(--accent); font-weight: 600; }
      .subtitle { color: var(--text-dim); font-size: 14px; margin-bottom: 28px; font-family: "IBM Plex Mono", monospace; }
      #ricerca {
        width: 100%;
        padding: 10px 16px;
        font-size: 14px;
        margin-bottom: 20px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 6px;
        color: var(--text);
        font-family: "IBM Plex Sans", sans-serif;
        transition: border-color 0.2s;
      }
      #ricerca:focus { outline: none; border-color: var(--accent); }
      #ricerca::placeholder { color: var(--text-muted); }
      .table-wrap { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      thead tr { background: var(--surface2); }
      th {
        padding: 10px 16px;
        text-align: left;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-dim);
        font-family: "IBM Plex Mono", monospace;
      }
      td { padding: 11px 16px; border-bottom: 1px solid var(--border); }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: var(--surface); }
      td a { color: var(--accent); text-decoration: none; font-weight: 500; }
      td a:hover { text-decoration: underline; }
      .ticker-cell { font-family: "IBM Plex Mono", monospace; font-size: 13px; color: var(--text-dim); }
      .cik-cell { font-family: "IBM Plex Mono", monospace; font-size: 12px; color: var(--text-muted); }
      #paginazione {
        margin-top: 20px;
        display: flex;
        gap: 10px;
        align-items: center;
        font-family: "IBM Plex Mono", monospace;
        font-size: 13px;
        color: var(--text-dim);
      }
      button {
        padding: 7px 16px;
        cursor: pointer;
        border: 1px solid var(--border);
        border-radius: 6px;
        background: var(--surface);
        color: var(--text-dim);
        font-family: "IBM Plex Mono", monospace;
        font-size: 12px;
        transition: all 0.15s;
      }
      button:hover { border-color: var(--accent); color: var(--accent); }
      button:disabled { opacity: 0.3; cursor: default; }
      button:disabled:hover { border-color: var(--border); color: var(--text-muted); }
    </style>
  </head>
  <body>
    <script src="/navbar.js"></script>

    <h1>Aziende <span>USA</span></h1>
    <p class="subtitle">// lista completa aziende quotate · fonte: SEC EDGAR</p>

    <input type="text" id="ricerca" placeholder="Cerca per nome o ticker..." />

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nome azienda</th>
            <th>Ticker</th>
            <th>CIK</th>
          </tr>
        </thead>
        <tbody id="tabella"></tbody>
      </table>
    </div>

    <div id="paginazione">
      <button id="btn-precedente">← Precedente</button>
      <span id="info-pagina"></span>
      <button id="btn-successivo">Successivo →</button>
    </div>

    <script src="/app.js"></script>
  </body>
</html>
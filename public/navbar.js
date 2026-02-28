(function () {
  const currentPath = window.location.pathname;

  const links = [
    { href: "/", label: "Aziende" },
    { href: "/calendario.html", label: "Trimestrali" },
    { href: "/dividendi.html", label: "Dividendi" },
    { href: "/splits.html", label: "Splits" },
    { href: "/ipo.html", label: "IPO" },
    { href: "/listing.html", label: "Listing" },
    { href: "/financial-check-edgar.html", label: "FC Edgar" },
    { href: "/financial-check.html", label: "FC Alpha" },
  ];

  const navHTML = `
    <nav class="navbar">
      <a class="navbar-brand" href="/">📊 Edgar Dashboard</a>
      <div class="navbar-links">
        ${links
          .map(
            (l) =>
              `<a href="${l.href}" class="nav-link${currentPath === l.href || (l.href !== "/" && currentPath.startsWith(l.href.replace(".html", ""))) ? " active" : ""}">${l.label}</a>`,
          )
          .join("")}
      </div>
    </nav>
  `;

  const style = `
    <style>
      .navbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        height: 52px;
        background: #111827;
        border-bottom: 1px solid #1f2d45;
        position: sticky;
        top: 0;
        z-index: 100;
        font-family: 'IBM Plex Mono', monospace;
      }
      .navbar-brand {
        font-size: 14px;
        font-weight: 600;
        color: #00d4ff;
        text-decoration: none;
        letter-spacing: 0.03em;
      }
      .navbar-links { display: flex; gap: 4px; }
      .nav-link {
        color: #64748b;
        text-decoration: none;
        font-size: 12px;
        padding: 6px 12px;
        border-radius: 4px;
        transition: all 0.15s;
        letter-spacing: 0.05em;
      }
      .nav-link:hover { color: #e2e8f0; background: #1a2235; }
      .nav-link.active { color: #00d4ff; background: rgba(0,212,255,0.08); }
    </style>
  `;

  document.head.insertAdjacentHTML("beforeend", style);
  document.body.insertAdjacentHTML("afterbegin", navHTML);
})();

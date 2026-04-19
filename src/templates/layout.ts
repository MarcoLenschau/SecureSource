const themeScript = `
  const t = localStorage.getItem('theme');
  const d = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', d);
`.trim();

const sharedStyles = `
body { font-family: 'Inter', sans-serif; }
.mono { font-family: 'JetBrains Mono', monospace; }

:root {
  --bg-page:    #f0f4f8;
  --bg-card:    #ffffff;
  --bg-input:   #f8fafc;
  --bg-2nd:     #e2e8f0;
  --bg-2nd-h:   #cbd5e1;
  --border:     #e2e8f0;
  --text:       #0f172a;
  --text-muted: #64748b;
  --text-code:  #0284c7;
  --card-shadow: 0 0 0 1px rgba(0,0,0,.06), 0 24px 64px rgba(0,0,0,.08);
  --header-bg:  rgba(240,244,248,.8);
  --header-border: #e2e8f0;
}
html.dark {
  --bg-page:    #020817;
  --bg-card:    #0b1120;
  --bg-input:   #030d1a;
  --bg-2nd:     #1e293b;
  --bg-2nd-h:   #273549;
  --border:     #1e293b;
  --text:       #e2e8f0;
  --text-muted: #64748b;
  --text-code:  #22d3ee;
  --card-shadow: 0 0 0 1px rgba(6,182,212,.08), 0 24px 64px rgba(0,0,0,.6);
  --header-bg:  rgba(2,8,23,.8);
  --header-border: #1e293b;
}

body { background: var(--bg-page); color: var(--text); transition: background .2s, color .2s; }

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: var(--card-shadow);
  transition: background .2s, border-color .2s, box-shadow .2s;
}
.input-field {
  background: var(--bg-input);
  border: 1px solid var(--border);
  color: var(--text);
  transition: background .2s, border-color .2s;
}
.input-field:focus { box-shadow: 0 0 0 2px rgba(6,182,212,.3); outline: none; }
.btn-secondary {
  background: var(--bg-2nd);
  color: var(--text);
  transition: background .2s;
}
.btn-secondary:hover { background: var(--bg-2nd-h); }
.text-muted { color: var(--text-muted); }
.text-code { color: var(--text-code); }
.border-theme { border-color: var(--border); }
.link-box { background: var(--bg-input); border: 1px solid var(--border); box-shadow: inset 0 2px 8px rgba(0,0,0,.15); }
.badge-secure { background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.2); }

.site-header {
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  backdrop-filter: blur(12px);
  transition: background .2s, border-color .2s;
}
.theme-btn {
  background: var(--bg-2nd);
  color: var(--text-muted);
  transition: background .2s, color .2s;
}
.theme-btn:hover { background: var(--bg-2nd-h); color: var(--text); }

@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
.fade-in { animation: fadeIn .35s ease forwards; }
`.trim();

const headerHtml = `
  <header class="site-header sticky top-0 z-10 w-full">
    <div class="max-w-screen-lg mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <img src="/logo.svg" alt="SecureDrop" class="w-7 h-7" />
        <span class="mono text-sm font-medium">SecureDrop</span>
      </div>
      <button id="themeToggle" class="theme-btn w-9 h-9 flex items-center justify-center rounded-lg" title="Theme wechseln"></button>
    </div>
  </header>
`.trim();

export function layout(title: string, pageStyles: string, mainContent: string, scripts: string[]): string {
  return `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/svg+xml" href="/logo.svg" />
  <script>${themeScript}</script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
${sharedStyles}
${pageStyles}
  </style>
</head>
<body class="min-h-screen flex flex-col">

  ${headerHtml}

  ${mainContent}

  ${scripts.map(s => `<script type="module" src="${s}"></script>`).join('\n  ')}
</body>
</html>`;
}

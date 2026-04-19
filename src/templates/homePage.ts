import { layout } from './layout.js';

const styles = `
.option-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: var(--card-shadow);
  transition: border-color .2s, box-shadow .2s, transform .15s;
  cursor: pointer;
  text-decoration: none;
  color: var(--text);
  display: block;
}
.option-card:hover {
  border-color: #06b6d4;
  box-shadow: 0 0 0 1px rgba(6,182,212,.2), 0 24px 64px rgba(0,0,0,.15);
  transform: translateY(-2px);
}
`.trim();

const main = `
  <main class="flex-1 flex flex-col items-center justify-center px-4">
    <div class="text-center mb-10">
      <img src="/logo.svg" alt="SecureDrop" class="w-12 h-12 mx-auto mb-4" />
      <h1 class="text-2xl font-semibold mb-2">SecureDrop</h1>
      <p class="text-muted text-sm">End-to-end verschlüsselt · Einmalig lesbar · Zero-knowledge</p>
    </div>

    <div class="w-full max-w-lg grid gap-4 sm:grid-cols-2">

      <a href="/create" class="option-card sm:rounded-2xl p-6">
        <div class="mb-4 w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h2 class="font-semibold mb-1">Nachricht</h2>
        <p class="text-muted text-sm">Geheimen Text senden — wird nach dem Lesen vernichtet</p>
      </a>

      <a href="/upload" class="option-card sm:rounded-2xl p-6">
        <div class="mb-4 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <h2 class="font-semibold mb-1">Datei</h2>
        <p class="text-muted text-sm">Datei sicher hochladen — max. 10 MB, einmalig abrufbar</p>
      </a>

    </div>

    <p class="mt-10 text-muted text-xs mono">Der Schlüssel verlässt nie deinen Browser.</p>
  </main>
`.trim();

export function homePage(): string {
  return layout('SecureDrop', styles, main, ['/js/theme.js']);
}

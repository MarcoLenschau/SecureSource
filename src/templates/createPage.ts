import { layout } from './layout.js';

const styles = `
.btn-primary {
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  box-shadow: 0 0 24px rgba(6,182,212,.25);
  transition: box-shadow .2s, transform .15s;
}
.btn-primary:hover:not(:disabled) { box-shadow: 0 0 36px rgba(6,182,212,.45); transform: translateY(-1px); }
.btn-primary:disabled { background: var(--bg-2nd); box-shadow: none; cursor: not-allowed; }
`.trim();

const main = `
  <main class="flex-1 flex flex-col items-center justify-center">
    <div class="w-full sm:max-w-lg card sm:rounded-2xl p-5 sm:p-8 sm:my-6 sm:mx-4">

      <h1 class="text-xl font-semibold mb-1">Geheime Nachricht</h1>
      <p class="text-muted text-sm mb-5">End-to-end verschlüsselt · Einmalig lesbar · Danach vernichtet</p>

      <span class="badge-secure inline-flex items-center gap-1.5 text-emerald-500 text-xs mono px-2.5 py-1 rounded-full mb-6">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        AES-256-GCM · Zero-knowledge
      </span>

      <div class="relative">
        <textarea
          id="message"
          placeholder="Nachricht eingeben …"
          class="input-field w-full min-h-36 rounded-xl text-sm p-4 resize-y placeholder:text-slate-500 leading-relaxed"
        ></textarea>
        <span class="absolute bottom-3 right-3 text-muted text-xs mono" id="charCount">0</span>
      </div>

      <button id="createBtn" class="btn-primary mt-4 w-full py-3 text-white font-semibold rounded-xl text-sm">
        Link generieren
      </button>

      <div id="result" class="hidden fade-in mt-6">
        <div class="flex items-center gap-2 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span class="text-emerald-500 text-xs font-medium">Link erstellt — funktioniert nur einmal</span>
        </div>
        <div class="link-box rounded-xl p-3 flex gap-2 items-center">
          <input id="link" type="text" readonly class="flex-1 bg-transparent text-code mono text-xs outline-none truncate min-w-0" />
          <button id="copyBtn" class="btn-secondary shrink-0 px-3 py-2 rounded-lg text-xs font-medium">Kopieren</button>
        </div>
        <p class="mt-3 text-amber-500 text-xs mono flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Nachricht wird nach erstem Öffnen permanent gelöscht
        </p>
      </div>
    </div>

    <p class="mt-4 mb-4 text-muted text-xs mono">Der Schlüssel verlässt nie deinen Browser.</p>
  </main>
`.trim();

export function createPage(): string {
  return layout('SecureDrop', styles, main, ['/js/theme.js', '/js/create.js']);
}

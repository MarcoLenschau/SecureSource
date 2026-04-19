import { layout } from './layout.js';

const styles = `
.btn-primary {
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  box-shadow: 0 0 24px rgba(6,182,212,.25);
  transition: box-shadow .2s, transform .15s;
}
.btn-primary:hover:not(:disabled) { box-shadow: 0 0 36px rgba(6,182,212,.45); transform: translateY(-1px); }
.btn-primary:disabled { background: var(--bg-2nd); box-shadow: none; cursor: not-allowed; }

.step-dot {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--bg-2nd); color: var(--text-muted);
  font-size: 11px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  transition: background .2s, color .2s;
  font-family: 'JetBrains Mono', monospace;
}
.step-dot.active { background: #06b6d4; color: #fff; }
.step-dot.done { background: #10b981; color: #fff; }
.step-label { font-size: 11px; color: var(--text-muted); transition: color .2s; }
.step-label.active { color: var(--text); }
.step-label.done { color: #10b981; }
`.trim();

const main = `
  <main class="flex-1 flex flex-col items-center justify-center">
    <div class="w-full sm:max-w-lg sm:my-6 sm:mx-4">

      <div class="flex items-center gap-3 mb-5 px-5 sm:px-0">
        <a href="/" class="text-muted hover:text-cyan-500 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </a>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5">
            <div id="step1dot" class="step-dot active">1</div>
            <span id="step1label" class="step-label active">Schreiben</span>
          </div>
          <div class="w-6 h-px bg-border" style="background:var(--border)"></div>
          <div class="flex items-center gap-1.5">
            <div id="step2dot" class="step-dot">2</div>
            <span id="step2label" class="step-label">Verschlüsseln</span>
          </div>
          <div class="w-6 h-px" style="background:var(--border)"></div>
          <div class="flex items-center gap-1.5">
            <div id="step3dot" class="step-dot">3</div>
            <span id="step3label" class="step-label">Link</span>
          </div>
        </div>
      </div>

      <div class="card sm:rounded-2xl p-5 sm:p-8">

        <div id="composeState">
          <h1 class="text-xl font-semibold mb-1">Geheime Nachricht</h1>
          <p class="text-muted text-sm mb-5">End-to-end verschlüsselt · Einmalig lesbar · Danach vernichtet</p>

          <span class="badge-secure inline-flex items-center gap-1.5 text-emerald-500 text-xs mono px-2.5 py-1 rounded-full mb-5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            AES-256-GCM · Zero-knowledge
          </span>

          <div class="relative mb-4">
            <textarea
              id="message"
              placeholder="Nachricht eingeben …"
              class="input-field w-full min-h-36 rounded-xl text-sm p-4 resize-y placeholder:text-slate-500 leading-relaxed"
            ></textarea>
            <span class="absolute bottom-3 right-3 text-muted text-xs mono" id="charCount">0</span>
          </div>

          <div class="mb-4">
            <label class="text-xs text-muted block mb-1.5">Passwort (optional)</label>
            <input
              id="password"
              type="password"
              placeholder="Nachricht mit Passwort schützen …"
              class="input-field w-full rounded-xl text-sm px-4 py-2.5 placeholder:text-slate-500"
            />
          </div>

          <button id="createBtn" class="btn-primary w-full py-3 text-white font-semibold rounded-xl text-sm">
            Verschlüsseln &amp; Link erstellen
          </button>
        </div>

        <div id="encryptingState" class="hidden flex flex-col items-center justify-center py-10 gap-3">
          <svg class="animate-spin w-8 h-8 text-cyan-500" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="60" stroke-dashoffset="20"/>
          </svg>
          <p class="text-muted text-sm">Verschlüssele …</p>
        </div>

        <div id="resultState" class="hidden fade-in">
          <div class="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span class="text-emerald-500 text-xs font-medium">Link erstellt — funktioniert nur einmal</span>
          </div>
          <div class="link-box rounded-xl p-3 flex gap-2 items-center">
            <input id="link" type="text" readonly class="flex-1 bg-transparent text-code mono text-xs outline-none truncate min-w-0" />
            <button id="copyBtn" class="btn-secondary shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium">
              <svg id="copyIcon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Kopieren
            </button>
          </div>
          <p class="mt-3 text-amber-500 text-xs mono flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Nachricht wird nach erstem Öffnen permanent gelöscht
          </p>
        </div>

      </div>

      <p class="mt-4 mb-4 text-center text-muted text-xs mono">Der Schlüssel verlässt nie deinen Browser.</p>
    </div>
  </main>
`.trim();

export function createPage(): string {
  return layout('SecureDrop — Nachricht', styles, main, ['/js/theme.js', '/js/create.js']);
}

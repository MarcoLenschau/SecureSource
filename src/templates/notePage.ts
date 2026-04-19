import { layout } from './layout.js';

const styles = `
.message-box { background: var(--bg-input); border: 1px solid var(--border); box-shadow: inset 0 2px 8px rgba(0,0,0,.15); }

.btn-reveal {
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  box-shadow: 0 0 32px rgba(6,182,212,.3);
  transition: box-shadow .2s, transform .15s;
}
.btn-reveal:hover { box-shadow: 0 0 48px rgba(6,182,212,.5); transform: translateY(-1px); }

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 32px rgba(6,182,212,.3); }
  50%       { box-shadow: 0 0 52px rgba(6,182,212,.55); }
}
#revealBtn { animation: pulse-glow 2.5s ease-in-out infinite; }
`.trim();

const main = `
  <main class="flex-1 flex flex-col items-center justify-center">
    <div class="w-full sm:max-w-lg card sm:rounded-2xl p-5 sm:p-8 sm:my-6 sm:mx-4">

      <h1 class="text-xl font-semibold mb-1">Geheime Nachricht</h1>
      <p class="text-muted text-sm mb-6">Verschlüsselte Nachricht für dich</p>

      <div id="loadingState" class="hidden flex items-center gap-2 text-muted text-sm">
        <svg class="animate-spin w-4 h-4 text-cyan-500" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="60" stroke-dashoffset="20"/>
        </svg>
        Überprüfe Nachricht …
      </div>

      <div id="revealWrapper" class="hidden text-center">
        <div class="mb-4 inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs mono px-3 py-1.5 rounded-full">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Einmalig lesbar · danach unwiderruflich gelöscht
        </div>
        <br />
        <button id="revealBtn" class="btn-reveal w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-8 text-white font-semibold rounded-xl text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Nachricht öffnen
        </button>
      </div>

      <div id="messageBox" class="hidden fade-in message-box rounded-xl p-5 mono text-sm whitespace-pre-wrap break-words leading-relaxed"></div>

      <p id="destroyedNote" class="hidden mt-3 text-xs mono text-muted flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Nachricht wurde vom Server gelöscht
      </p>

      <div id="errorBox" class="hidden fade-in mt-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mono"></div>

      <div class="mt-8 pt-6 border-t border-theme">
        <a href="/" class="text-muted hover:text-cyan-500 transition-colors text-sm flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Neue Nachricht erstellen
        </a>
      </div>
    </div>

    <p class="mt-4 mb-4 text-muted text-xs mono">Der Schlüssel verlässt nie deinen Browser.</p>
  </main>
`.trim();

export function notePage(): string {
  return layout('SecureDrop', styles, main, ['/js/theme.js', '/js/note.js']);
}

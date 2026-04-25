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
  <main class="flex-1 flex flex-col items-center justify-center px-4 md:px-8">
    <div class="text-center mb-10">
      <img src="/logo.svg" alt="SecureDrop" class="w-12 h-12 mx-auto mb-4" />
      <h1 class="text-2xl md:text-3xl font-semibold mb-2">SecureDrop</h1>
      <p class="text-muted text-sm md:text-base">End-to-end encrypted · One-time read · Zero-knowledge</p>
    </div>

    <div class="w-full max-w-lg md:max-w-xl grid gap-4 md:gap-6 sm:grid-cols-2">

      <a href="/create" class="option-card sm:rounded-2xl p-6">
        <div class="mb-4 w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h2 class="font-semibold mb-1">Message</h2>
        <p class="text-muted text-sm">Send a secret text — destroyed after reading</p>
      </a>

      <a href="/upload" class="option-card sm:rounded-2xl p-6">
        <div class="mb-4 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <h2 class="font-semibold mb-1">File</h2>
        <p class="text-muted text-sm">Upload a file securely — max. 10 MB, one-time access</p>
      </a>

    </div>

    <p class="mt-10 text-muted text-xs mono">The key never leaves your browser.</p>
  </main>
`.trim();

/** Generates the home page with options for message and file sharing. */
export function homePage(): string {
  return layout('SecureDrop', styles, main, ['/js/theme.js']);
}

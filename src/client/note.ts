/** Decodes a base64url string to a Uint8Array. */
const fromBase64url = (str: string): Uint8Array<ArrayBuffer> => {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64 + '='.repeat((4 - b64.length % 4) % 4);
  return Uint8Array.from(atob(pad), c => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
};

/** Returns the DOM element with the given id. */
const el = (id: string) => document.getElementById(id)!;

/** Shows an error message and hides all other states. */
function showError(msg: string): void {
  el('loadingState').classList.add('hidden');
  el('revealWrapper').classList.add('hidden');
  el('revealedState').classList.add('hidden');
  el('errorBox').textContent = msg;
  el('errorBox').classList.remove('hidden');
}

/** Validates the URL fragment (2 or 3 parts) and returns its parts, or null if invalid. */
function validateFragment(fragment: string): string[] | null {
  if (!fragment) { showError('Ungültiger Link — kein Schlüssel im Fragment.'); return null; }
  const parts = fragment.split('.');
  if (parts.length !== 2 && parts.length !== 3) { showError('Ungültiges Link-Format.'); return null; }
  return parts;
}

/** Fetches the encrypted ciphertext for the given note id from the API. */
async function fetchCiphertext(id: string): Promise<string> {
  const res = await fetch(`/api/notes/${id}`);
  if (!res.ok) throw new Error('Nachricht nicht gefunden oder wurde bereits gelesen.');
  const { ciphertext } = await res.json() as { ciphertext: string };
  return ciphertext;
}

/** Derives an AES-KW key from a password and salt using PBKDF2 (600k iterations). */
async function deriveWrappingKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    base,
    { name: 'AES-KW', length: 256 },
    false,
    ['unwrapKey']
  );
}

/** Unwraps an AES-GCM decryption key using a password-derived AES-KW wrapping key. */
async function unwrapDecryptKey(wrappedKeyB64: string, password: string, saltB64: string): Promise<CryptoKey> {
  const wrappingKey = await deriveWrappingKey(password, fromBase64url(saltB64));
  return crypto.subtle.unwrapKey(
    'raw', fromBase64url(wrappedKeyB64), wrappingKey, 'AES-KW',
    { name: 'AES-GCM' }, false, ['decrypt']
  );
}

/** Imports the AES-GCM decryption key — directly for 2-part fragments, via password for 3-part. */
async function importDecryptKey(parts: string[]): Promise<CryptoKey> {
  if (parts.length === 2) {
    return crypto.subtle.importKey('raw', fromBase64url(parts[0]), { name: 'AES-GCM' }, false, ['decrypt']);
  }
  const password = (el('passwordInput') as HTMLInputElement).value;
  return unwrapDecryptKey(parts[0], password, parts[2]);
}

/** Decrypts the note ciphertext using the fragment parts and renders the plaintext message. */
async function decryptAndDisplay(parts: string[], ciphertextB64: string): Promise<void> {
  const key = await importDecryptKey(parts);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64url(parts[1]) }, key, fromBase64url(ciphertextB64)
  );
  el('loadingState').classList.add('hidden');
  el('messageBox').textContent = new TextDecoder().decode(decrypted);
  el('revealedState').classList.remove('hidden');
}

/** Returns the note ID from the current URL path. */
function getNoteId(): string {
  return location.pathname.split('/').pop() ?? '';
}

/** Fetches and decrypts the note referenced in the URL fragment. */
async function revealNote(): Promise<void> {
  el('revealWrapper').classList.add('hidden');
  el('loadingState').classList.remove('hidden');
  const parts = location.hash.slice(1).split('.');
  if (parts.length !== 2 && parts.length !== 3) return showError('Ungültiges Link-Format.');
  try {
    const ciphertextB64 = await fetchCiphertext(getNoteId());
    await decryptAndDisplay(parts, ciphertextB64);
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.');
  }
}

/** Plays the burn animation on the message wrap, then shows the destroyed state. */
function destroyNote(): void {
  const wrap = el('messageWrap');
  wrap.classList.add('burning');
  wrap.addEventListener('animationend', () => {
    el('revealedState').classList.add('hidden');
    el('destroyedState').classList.remove('hidden');
  }, { once: true });
}

/** Validates the fragment and checks whether the note exists before showing the reveal button. */
async function init(): Promise<void> {
  const parts = validateFragment(location.hash.slice(1));
  if (!parts) return;
  if (parts.length === 3) el('passwordWrapper').classList.remove('hidden');
  el('loadingState').classList.remove('hidden');
  try {
    const res = await fetch(`/api/notes/${getNoteId()}`, { method: 'HEAD' });
    el('loadingState').classList.add('hidden');
    if (!res.ok) return showError('Nachricht wurde nicht gefunden.');
    el('revealWrapper').classList.remove('hidden');
  } catch {
    showError('Netzwerkfehler beim Überprüfen der Nachricht.');
  }
}

el('revealBtn').addEventListener('click', revealNote);
el('destroyBtn').addEventListener('click', destroyNote);
init();
export {};

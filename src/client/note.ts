/** Decodes a base64url string to a Uint8Array. */
const fromBase64url = (str: string): Uint8Array<ArrayBuffer> => {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64 + '='.repeat((4 - b64.length % 4) % 4);
  return Uint8Array.from(atob(pad), c => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
};

/** Returns the DOM element with the given id. */
const el = (id: string) => document.getElementById(id)!;

/** Shows an error message and hides the loading and reveal states. */
function showError(msg: string): void {
  el('loadingState').classList.add('hidden');
  el('revealWrapper').classList.add('hidden');
  el('errorBox').textContent = msg;
  el('errorBox').classList.remove('hidden');
}

/** Validates the URL fragment and returns its parts, or null if invalid. */
function validateFragment(fragment: string): string[] | null {
  if (!fragment) { showError('Ungültiger Link — kein Schlüssel im Fragment.'); return null; }
  const parts = fragment.split('.');
  if (parts.length !== 3) { showError('Ungültiges Link-Format.'); return null; }
  return parts;
}

/** Fetches the encrypted ciphertext for the given note id from the API. */
async function fetchCiphertext(id: string): Promise<string> {
  const res = await fetch(`/api/notes/${id}`);
  if (!res.ok) throw new Error('Nachricht nicht gefunden oder wurde bereits gelesen.');
  const { ciphertext } = await res.json() as { ciphertext: string };
  return ciphertext;
}

/** Decrypts the ciphertext and renders the plaintext message in the UI. */
async function decryptAndDisplay(ciphertextB64: string, keyB64: string, ivB64: string): Promise<void> {
  const key = await crypto.subtle.importKey(
    'raw', fromBase64url(keyB64), { name: 'AES-GCM' }, false, ['decrypt']
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64url(ivB64) }, key, fromBase64url(ciphertextB64)
  );
  el('loadingState').classList.add('hidden');
  el('messageBox').textContent = new TextDecoder().decode(decrypted);
  el('messageBox').classList.remove('hidden');
  el('destroyedNote').classList.remove('hidden');
}

/** Fetches and decrypts the note referenced in the URL fragment. */
async function revealNote(): Promise<void> {
  el('revealWrapper').classList.add('hidden');
  el('loadingState').classList.remove('hidden');
  const parts = location.hash.slice(1).split('.');
  if (parts.length !== 3) return showError('Ungültiges Link-Format.');
  const [id, keyB64, ivB64] = parts;
  try {
    const ciphertextB64 = await fetchCiphertext(id);
    await decryptAndDisplay(ciphertextB64, keyB64, ivB64);
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.');
  }
}

/** Validates the fragment and checks whether the note exists before showing the reveal button. */
async function init(): Promise<void> {
  const parts = validateFragment(location.hash.slice(1));
  if (!parts) return;
  el('loadingState').classList.remove('hidden');
  try {
    const res = await fetch(`/api/notes/${parts[0]}`, { method: 'HEAD' });
    el('loadingState').classList.add('hidden');
    if (!res.ok) return showError('Nachricht wurde nicht gefunden.');
    el('revealWrapper').classList.remove('hidden');
  } catch {
    showError('Netzwerkfehler beim Überprüfen der Nachricht.');
  }
}

el('revealBtn').addEventListener('click', revealNote);
init();
export {};

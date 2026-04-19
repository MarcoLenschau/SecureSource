/** Converts ArrayBuffer or Uint8Array to a base64url encoded string. */
const toBase64url = (buf: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

/** Generates an AES-GCM key, encrypts the message and returns the raw materials. */
async function encryptMessage(message: string): Promise<{ encrypted: ArrayBuffer; rawKey: ArrayBuffer; iv: Uint8Array<ArrayBuffer> }> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(message)
  );
  const rawKey = await crypto.subtle.exportKey('raw', key);
  return { encrypted, rawKey, iv };
}

/** Posts the encrypted ciphertext to the API and returns the note id. */
async function postNote(ciphertext: string): Promise<string> {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ciphertext }),
  });
  if (!res.ok) throw new Error('Failed to save');
  const { id } = await res.json() as { id: string };
  return id;
}

/** Derives an AES-KW wrapping key from a password using PBKDF2 (600k iterations). */
async function deriveWrappingKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    base,
    { name: 'AES-KW', length: 256 },
    false,
    ['wrapKey', 'unwrapKey']
  );
}

/** Wraps the raw AES key with a password-derived AES-KW key and returns wrapped key and salt. */
async function wrapKeyWithPassword(rawKey: ArrayBuffer, password: string): Promise<{ wrappedKey: ArrayBuffer; salt: Uint8Array<ArrayBuffer> }> {
  const salt = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>;
  const wrappingKey = await deriveWrappingKey(password, salt);
  const keyToWrap = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const wrappedKey = await crypto.subtle.wrapKey('raw', keyToWrap, wrappingKey, 'AES-KW');
  return { wrappedKey, salt };
}

/** Builds the URL fragment — 3 parts without password, 4 parts with password. */
async function buildFragment(id: string, rawKey: ArrayBuffer, iv: Uint8Array<ArrayBuffer>, password: string): Promise<string> {
  if (!password) return `${id}.${toBase64url(rawKey)}.${toBase64url(iv)}`;
  const { wrappedKey, salt } = await wrapKeyWithPassword(rawKey, password);
  return `${id}.${toBase64url(wrappedKey)}.${toBase64url(iv)}.${toBase64url(salt)}`;
}

/** Hides the form and displays the shareable link. */
function showNoteLink(id: string, fragment: string, messageEl: HTMLTextAreaElement, btn: HTMLButtonElement): void {
  messageEl.classList.add('hidden');
  btn.classList.add('hidden');
  (document.getElementById('password') as HTMLInputElement)?.closest('.mt-3')?.classList.add('hidden');
  (document.getElementById('link') as HTMLInputElement).value = `${location.origin}/note/${id}#${fragment}`;
  document.getElementById('result')!.classList.remove('hidden');
}

/** Resets the create button and shows an error alert. */
function handleCreateError(btn: HTMLButtonElement): void {
  btn.disabled = false;
  btn.textContent = 'Link generieren';
  alert('Fehler beim Speichern. Bitte erneut versuchen.');
}

/** Disables the create button and sets the loading label. */
function initCreateButton(): HTMLButtonElement {
  const btn = document.getElementById('createBtn') as HTMLButtonElement;
  btn.disabled = true;
  btn.textContent = 'Wird erstellt …';
  return btn;
}

/** Encrypts the message, posts it to the API and shows the resulting link. */
async function createNote(): Promise<void> {
  const messageEl = document.getElementById('message') as HTMLTextAreaElement;
  const message = messageEl.value.trim();
  if (!message) return;
  const btn = initCreateButton();
  const password = (document.getElementById('password') as HTMLInputElement)?.value ?? '';
  try {
    const { encrypted, rawKey, iv } = await encryptMessage(message);
    const id = await postNote(toBase64url(encrypted));
    showNoteLink(id, await buildFragment(id, rawKey, iv, password), messageEl, btn);
  } catch {
    handleCreateError(btn);
  }
}

const messageEl = document.getElementById('message') as HTMLTextAreaElement;
const charCount = document.getElementById('charCount')!;
messageEl.addEventListener('input', () => { charCount.textContent = String(messageEl.value.length); });

document.getElementById('createBtn')!.addEventListener('click', createNote);
document.getElementById('copyBtn')!.addEventListener('click', async () => {
  const val = (document.getElementById('link') as HTMLInputElement).value;
  await navigator.clipboard.writeText(val);
  const btn = document.getElementById('copyBtn')!;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  setTimeout(() => { btn.textContent = 'Kopieren'; }, 2000);
});
export {};

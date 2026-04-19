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
async function deriveWrappingKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
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

/** Builds the URL fragment — 2 parts without password, 3 parts with password. ID is in the URL path. */
async function buildFragment(rawKey: ArrayBuffer, iv: Uint8Array<ArrayBuffer>, password: string): Promise<string> {
  if (!password) return `${toBase64url(rawKey)}.${toBase64url(iv)}`;
  const { wrappedKey, salt } = await wrapKeyWithPassword(rawKey, password);
  return `${toBase64url(wrappedKey)}.${toBase64url(iv)}.${toBase64url(salt)}`;
}

/** Shows the compose state (step 1). */
function showCompose(): void {
  document.getElementById('composeState')!.classList.remove('hidden');
  document.getElementById('encryptingState')!.classList.add('hidden');
  document.getElementById('resultState')!.classList.add('hidden');
}

/** Shows the encrypting/loading state (step 2). */
function showEncrypting(): void {
  document.getElementById('composeState')!.classList.add('hidden');
  document.getElementById('encryptingState')!.classList.remove('hidden');
  document.getElementById('resultState')!.classList.add('hidden');
}

/** Shows the link-ready state (step 3) with the shareable URL. */
function showResult(id: string, fragment: string): void {
  (document.getElementById('link') as HTMLInputElement).value = `${location.origin}/note/${id}#${fragment}`;
  document.getElementById('encryptingState')!.classList.add('hidden');
  document.getElementById('resultState')!.classList.remove('hidden');
  advanceSteps(3);
}

/** Updates the step indicator dots and labels. */
function advanceSteps(activeStep: number): void {
  [1, 2, 3].forEach(n => {
    const dot = document.getElementById(`step${n}dot`)!;
    const label = document.getElementById(`step${n}label`)!;
    dot.classList.remove('active', 'done');
    label.classList.remove('active', 'done');
    if (n < activeStep) {
      dot.classList.add('done');
      dot.textContent = '✓';
      label.classList.add('done');
    } else if (n === activeStep) {
      dot.classList.add('active');
      label.classList.add('active');
    }
  });
}

/** Handles an error during note creation. */
function handleCreateError(btn: HTMLButtonElement): void {
  showCompose();
  btn.disabled = false;
  btn.textContent = 'Verschlüsseln & Link erstellen';
  alert('Fehler beim Speichern. Bitte erneut versuchen.');
}

/** Encrypts the message, posts it to the API and shows the resulting link. */
async function createNote(): Promise<void> {
  const messageEl = document.getElementById('message') as HTMLTextAreaElement;
  const message = messageEl.value.trim();
  if (!message) return;

  const btn = document.getElementById('createBtn') as HTMLButtonElement;
  btn.disabled = true;
  advanceSteps(2);
  showEncrypting();

  const password = (document.getElementById('password') as HTMLInputElement)?.value ?? '';
  try {
    const { encrypted, rawKey, iv } = await encryptMessage(message);
    const id = await postNote(toBase64url(encrypted));
    showResult(id, await buildFragment(rawKey, iv, password));
  } catch {
    handleCreateError(btn);
  }
}

/** Handles the copy-to-clipboard action with icon swap feedback. */
async function handleCopy(): Promise<void> {
  const val = (document.getElementById('link') as HTMLInputElement).value;
  await navigator.clipboard.writeText(val);

  const icon = document.getElementById('copyIcon')!;
  icon.outerHTML = `<svg id="copyIcon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  setTimeout(() => {
    const currentIcon = document.getElementById('copyIcon')!;
    currentIcon.outerHTML = `<svg id="copyIcon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  }, 2000);
}

const messageEl = document.getElementById('message') as HTMLTextAreaElement;
const charCount = document.getElementById('charCount')!;
messageEl.addEventListener('input', () => { charCount.textContent = String(messageEl.value.length); });

document.getElementById('createBtn')!.addEventListener('click', createNote);
document.getElementById('copyBtn')!.addEventListener('click', handleCopy);
export {};

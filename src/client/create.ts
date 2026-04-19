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

/** Hides the form and displays the shareable link. */
function showNoteLink(id: string, rawKey: ArrayBuffer, iv: Uint8Array<ArrayBuffer>, messageEl: HTMLTextAreaElement, btn: HTMLButtonElement): void {
  const fragment = `${id}.${toBase64url(rawKey)}.${toBase64url(iv)}`;
  messageEl.classList.add('hidden');
  btn.classList.add('hidden');
  (document.getElementById('link') as HTMLInputElement).value = `${location.origin}/note/${id}#${fragment}`;
  document.getElementById('result')!.classList.remove('hidden');
}

/** Resets the create button and shows an error alert. */
function handleCreateError(btn: HTMLButtonElement): void {
  btn.disabled = false;
  btn.textContent = 'Link erstellen';
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
  try {
    const { encrypted, rawKey, iv } = await encryptMessage(message);
    const id = await postNote(toBase64url(encrypted));
    showNoteLink(id, rawKey, iv, messageEl, btn);
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

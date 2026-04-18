const toBase64url = (buf: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

async function createNote(): Promise<void> {
  const messageEl = document.getElementById('message') as HTMLTextAreaElement;
  const message = messageEl.value.trim();
  if (!message) return;

  const btn = document.getElementById('createBtn') as HTMLButtonElement;
  btn.disabled = true;
  btn.textContent = 'Wird erstellt …';

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(message)
  );
  const rawKey = await crypto.subtle.exportKey('raw', key);

  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ciphertext: toBase64url(encrypted) }),
  });

  if (!res.ok) {
    btn.disabled = false;
    btn.textContent = 'Link erstellen';
    alert('Fehler beim Speichern. Bitte erneut versuchen.');
    return;
  }

  const { id } = await res.json() as { id: string };
  const fragment = `${id}.${toBase64url(rawKey)}.${toBase64url(iv)}`;

  messageEl.classList.add('hidden');
  btn.classList.add('hidden');
  (document.getElementById('link') as HTMLInputElement).value =
    `${location.origin}/note/${id}#${fragment}`;
  document.getElementById('result')!.classList.remove('hidden');
}

document.getElementById('createBtn')!.addEventListener('click', createNote);
document.getElementById('copyBtn')!.addEventListener('click', async () => {
  const val = (document.getElementById('link') as HTMLInputElement).value;
  await navigator.clipboard.writeText(val);
});

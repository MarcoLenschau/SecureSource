interface FilePayload {
  name: string;
  type: string;
  data: string;
}

/** Decodes a base64url string to a Uint8Array. */
const fromBase64url = (str: string): Uint8Array<ArrayBuffer> => {
  const bytes = Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  return new Uint8Array(bytes.buffer.slice(0));
};

/** Returns the DOM element with the given id. */
const el = (id: string): HTMLElement => document.getElementById(id)!;

/** Formats a byte count as a human-readable string. */
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns the file ID from the current URL path. */
function getFileId(): string {
  return location.pathname.split('/').pop() ?? '';
}

/** Shows an error message and hides all other states. */
function showError(msg: string): void {
  el('loadingState').classList.add('hidden');
  el('revealWrapper').classList.add('hidden');
  el('errorBox').textContent = msg;
  el('errorBox').classList.remove('hidden');
}

/** Validates the URL fragment (must be 2 parts) and returns [keyB64, ivB64], or null. */
function parseFragment(fragment: string): [string, string] | null {
  const parts = fragment.split('.');
  if (parts.length !== 2) { showError('Invalid link format.'); return null; }
  return [parts[0], parts[1]];
}

/** Fetches the encrypted ciphertext for the given file id from the API. */
async function fetchCiphertext(id: string): Promise<string> {
  const res = await fetch(`/api/files/${id}`);
  if (!res.ok) throw new Error('File not found or already downloaded.');
  const { ciphertext } = await res.json() as { ciphertext: string };
  return ciphertext;
}

/** Decrypts the ciphertext using AES-GCM and returns the plaintext JSON string. */
async function decryptCiphertext(ciphertextB64: string, keyB64: string, ivB64: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', fromBase64url(keyB64), { name: 'AES-GCM' }, false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64url(ivB64) },
    key,
    fromBase64url(ciphertextB64),
  );
  return new TextDecoder().decode(decrypted);
}

/** Creates an object URL from a base64url-encoded string with the given MIME type. */
function base64ToObjectUrl(base64: string, mimeType: string): string {
  const bytes = Uint8Array.from(atob(base64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

/** Renders the file name and size into the fileName element. */
function renderMetadata(payload: FilePayload): void {
  const sizeBytes = Math.round(payload.data.length * 0.75);
  el('fileName').textContent = `${payload.name} · ${formatBytes(sizeBytes)}`;
}

/** Attaches the download handler to the download button. */
function setupDownload(payload: FilePayload): void {
  el('downloadBtn').addEventListener('click', () => {
    const url = base64ToObjectUrl(payload.data, payload.type);
    const a = document.createElement('a');
    a.href = url;
    a.download = payload.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  });
}

/** Renders file metadata and download button for the decrypted payload. */
function renderPreview(payload: FilePayload): void {
  renderMetadata(payload);
  setupDownload(payload);
  el('previewArea').classList.remove('hidden');
}

/** Decrypts the file and passes the payload to the renderer. */
async function decryptAndRender(parts: [string, string]): Promise<void> {
  const [keyB64, ivB64] = parts;
  const ciphertextB64 = await fetchCiphertext(getFileId());
  const json = await decryptCiphertext(ciphertextB64, keyB64, ivB64);
  el('loadingState').classList.add('hidden');
  renderPreview(JSON.parse(json) as FilePayload);
}

/** Fetches and decrypts the file referenced in the URL fragment. */
async function revealFile(): Promise<void> {
  el('revealWrapper').classList.add('hidden');
  el('loadingState').classList.remove('hidden');
  const parts = parseFragment(location.hash.slice(1));
  if (!parts) return;
  try {
    await decryptAndRender(parts);
  } catch (err) {
    showError(err instanceof Error ? err.message : 'An error occurred.');
  }
}

/** Validates the fragment and checks whether the file exists before showing the reveal button. */
async function init(): Promise<void> {
  const parts = parseFragment(location.hash.slice(1));
  if (!parts) return;
  el('loadingState').classList.remove('hidden');
  try {
    const res = await fetch(`/api/files/${getFileId()}`, { method: 'HEAD' });
    el('loadingState').classList.add('hidden');
    if (!res.ok) { showError('File not found or already downloaded.'); return; }
    el('revealWrapper').classList.remove('hidden');
  } catch {
    showError('Network error while checking file.');
  }
}

el('revealBtn').addEventListener('click', revealFile);
init();
export {};

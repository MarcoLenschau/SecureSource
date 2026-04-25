interface FilePayload {
  name: string;
  type: string;
  data: string;
}

const fromBase64url = (str: string): Uint8Array<ArrayBuffer> => {
  const bytes = Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  return new Uint8Array(bytes.buffer.slice(0));
};

const el = (id: string): HTMLElement => document.getElementById(id)!;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileId(): string {
  return location.pathname.split('/').pop() ?? '';
}

function showError(msg: string): void {
  el('loadingState').classList.add('hidden');
  el('revealWrapper').classList.add('hidden');
  el('errorBox').textContent = msg;
  el('errorBox').classList.remove('hidden');
}

function parseFragment(fragment: string): [string, string] | null {
  const parts = fragment.split('.');
  if (parts.length !== 2) { showError('Invalid link format.'); return null; }
  return [parts[0], parts[1]];
}

async function fetchCiphertext(id: string): Promise<string> {
  const res = await fetch(`/api/files/${id}`);
  if (!res.ok) throw new Error('File not found or already downloaded.');
  const { ciphertext } = await res.json() as { ciphertext: string };
  return ciphertext;
}

async function decryptCiphertext(ciphertextB64: string, keyB64: string, ivB64: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', fromBase64url(keyB64), { name: 'AES-GCM' }, false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64url(ivB64) },
    key,
    fromBase64url(ciphertextB64),
  );
  return new TextDecoder().decode(decrypted);
}

function base64ToObjectUrl(base64: string, mimeType: string): string {
  const bytes = Uint8Array.from(atob(base64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

function renderMetadata(payload: FilePayload): void {
  const sizeBytes = Math.round(payload.data.length * 0.75);
  el('metaFileName').textContent = payload.name;
  el('metaFileType').textContent = payload.type || 'unknown';
  el('metaFileSize').textContent = formatBytes(sizeBytes);
  el('fileMeta').classList.remove('hidden');
}

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

function renderPreview(payload: FilePayload): void {
  renderMetadata(payload);

  if (payload.type.startsWith('image/')) {
    const img = el('previewImage') as HTMLImageElement;
    img.src = base64ToObjectUrl(payload.data, payload.type);
    el('imagePreview').classList.remove('hidden');
  } else if (payload.type === 'application/pdf') {
    (el('previewPdf') as HTMLIFrameElement).src = base64ToObjectUrl(payload.data, payload.type);
    el('pdfPreview').classList.remove('hidden');
  } else if (payload.type.startsWith('text/')) {
    const bytes = Uint8Array.from(atob(payload.data.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    el('previewText').textContent = new TextDecoder().decode(bytes);
    el('textPreview').classList.remove('hidden');
  } else {
    el('downloadFallback').classList.remove('hidden');
  }

  setupDownload(payload);
  el('previewArea').classList.remove('hidden');
}

async function revealFile(): Promise<void> {
  el('revealWrapper').classList.add('hidden');
  el('loadingState').classList.remove('hidden');

  const parts = parseFragment(location.hash.slice(1));
  if (!parts) return;

  const [keyB64, ivB64] = parts;
  try {
    const ciphertextB64 = await fetchCiphertext(getFileId());
    const json = await decryptCiphertext(ciphertextB64, keyB64, ivB64);
    const payload = JSON.parse(json) as FilePayload;
    el('loadingState').classList.add('hidden');
    renderPreview(payload);
  } catch (err) {
    showError(err instanceof Error ? err.message : 'An error occurred.');
  }
}

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

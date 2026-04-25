const MAX_FILE_BYTES = 10 * 1024 * 1024;

const toBase64url = (buf: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

/** Reads a File as an ArrayBuffer. */
function readFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/** Strips EXIF from images by redrawing onto a canvas. Returns clean Blob. */
async function stripExif(file: File): Promise<ArrayBuffer> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Canvas export failed')); return; }
        blob.arrayBuffer().then(resolve).catch(reject);
      }, file.type);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showMetadata(file: File, stripped: boolean): void {
  el('metaName').textContent = file.name;
  el('metaSize').textContent = formatBytes(file.size);
  el('metaType').textContent = file.type || 'unknown';
  el('metaModified').textContent = new Date(file.lastModified).toLocaleString();
  el('metaStripped').textContent = stripped ? 'Yes — EXIF removed via canvas' : 'No (non-image file)';
  el('metadataBox').classList.remove('hidden');
}

async function encryptBuffer(data: ArrayBuffer, name: string, type: string): Promise<{ ciphertext: string; key: ArrayBuffer; iv: Uint8Array }> {
  const payload = JSON.stringify({ name, type, data: toBase64url(data) });
  const encoded = new TextEncoder().encode(payload);

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const rawKey = await crypto.subtle.exportKey('raw', key);

  return { ciphertext: toBase64url(encrypted), key: rawKey, iv };
}

async function uploadFile(ciphertext: string): Promise<string> {
  const res = await fetch('/api/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ciphertext }),
  });
  if (!res.ok) throw new Error('Upload failed');
  const { id } = await res.json() as { id: string };
  return id;
}

function showResult(id: string, key: ArrayBuffer, iv: Uint8Array): void {
  const fragment = `${toBase64url(key)}.${toBase64url(iv)}`;
  const link = `${location.origin}/file/${id}#${fragment}`;
  el<HTMLInputElement>('link').value = link;
  el('uploadForm').classList.add('hidden');
  el('result').classList.remove('hidden');
}

async function handleUpload(): Promise<void> {
  const fileInput = el<HTMLInputElement>('fileInput');
  const file = fileInput.files?.[0];
  if (!file) return;

  if (file.size > MAX_FILE_BYTES) {
    showError(`File too large (max ${formatBytes(MAX_FILE_BYTES)})`);
    return;
  }

  const btn = el<HTMLButtonElement>('uploadBtn');
  btn.disabled = true;
  btn.textContent = 'Encrypting…';
  el('metadataBox').classList.add('hidden');

  try {
    const isImage = file.type.startsWith('image/');
    const data = isImage ? await stripExif(file) : await readFile(file);
    showMetadata(file, isImage);

    btn.textContent = 'Uploading…';
    const { ciphertext, key, iv } = await encryptBuffer(data, file.name, file.type);
    const id = await uploadFile(ciphertext);
    showResult(id, key, iv);
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Upload failed');
    btn.disabled = false;
    btn.textContent = 'Encrypt & Upload';
  }
}

function showError(msg: string): void {
  const box = el('errorBox');
  box.textContent = msg;
  box.classList.remove('hidden');
}

el('fileInput').addEventListener('change', () => {
  const file = el<HTMLInputElement>('fileInput').files?.[0];
  if (!file) return;
  el('fileName').textContent = file.name;
  el('fileSize').textContent = formatBytes(file.size);
  el('fileInfo').classList.remove('hidden');
  el('uploadBtn').removeAttribute('disabled');
  el('errorBox').classList.add('hidden');
});

el('uploadBtn').addEventListener('click', handleUpload);

el('copyBtn').addEventListener('click', async () => {
  const val = el<HTMLInputElement>('link').value;
  await navigator.clipboard.writeText(val);
  const btn = el('copyBtn');
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  setTimeout(() => { btn.textContent = 'Kopieren'; }, 2000);
});

// Drag & drop
const dropZone = el('dropZone');
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer?.files[0];
  if (!file) return;
  const dt = new DataTransfer();
  dt.items.add(file);
  el<HTMLInputElement>('fileInput').files = dt.files;
  el<HTMLInputElement>('fileInput').dispatchEvent(new Event('change'));
});
export {};

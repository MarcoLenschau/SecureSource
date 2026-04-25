const MAX_FILE_BYTES = 10 * 1024 * 1024;

const toBase64url = (buf: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

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

function showMetadata(file: File, exifStripped: boolean): void {
  el('metaName').textContent = file.name;
  el('metaType').textContent = file.type || 'unknown';
  el('metaSize').textContent = formatBytes(file.size);
  el('metaModified').textContent = new Date(file.lastModified).toLocaleString('de-DE');
  el('metaStripped').textContent = exifStripped ? 'Ja — EXIF via Canvas entfernt' : 'Nein (kein Bild)';
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
  if (!res.ok) throw new Error('Upload fehlgeschlagen');
  const { id } = await res.json() as { id: string };
  return id;
}

function showResult(id: string, key: ArrayBuffer, iv: Uint8Array): void {
  const fragment = `${toBase64url(key)}.${toBase64url(iv)}`;
  const link = `${location.origin}/file/${id}#${fragment}`;
  el<HTMLInputElement>('link').value = link;
  el('result').classList.remove('hidden');
}

function showError(msg: string): void {
  const box = el('errorBox');
  box.textContent = msg;
  box.classList.remove('hidden');
}

// Pending upload state
let pendingFile: File | null = null;
let pendingData: ArrayBuffer | null = null;

async function handlePreview(): Promise<void> {
  const file = el<HTMLInputElement>('fileInput').files?.[0];
  if (!file) return;

  if (file.size > MAX_FILE_BYTES) {
    showError(`Datei zu groß (max ${formatBytes(MAX_FILE_BYTES)})`);
    return;
  }

  const btn = el<HTMLButtonElement>('uploadBtn');
  btn.disabled = true;
  btn.textContent = 'Lese Datei …';
  el('errorBox').classList.add('hidden');

  try {
    const isImage = file.type.startsWith('image/');
    const data = isImage ? await stripExif(file) : await readFile(file);

    pendingFile = file;
    pendingData = data;

    showMetadata(file, isImage);
    el('uploadForm').classList.add('hidden');
    el('metaStep').classList.remove('hidden');
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Fehler beim Lesen der Datei');
    btn.disabled = false;
    btn.textContent = 'Encrypt & Upload';
  }
}

async function handleEncrypt(): Promise<void> {
  if (!pendingFile || !pendingData) return;

  const btn = el<HTMLButtonElement>('encryptBtn');
  btn.disabled = true;
  btn.textContent = 'Verschlüsselt …';

  try {
    const { ciphertext, key, iv } = await encryptBuffer(pendingData, pendingFile.name, pendingFile.type);
    btn.textContent = 'Lädt hoch …';
    const id = await uploadFile(ciphertext);
    el('metaStep').classList.add('hidden');
    showResult(id, key, iv);
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    btn.disabled = false;
    btn.textContent = 'Verschlüsseln & Hochladen';
  }
}

function handleBack(): void {
  pendingFile = null;
  pendingData = null;
  el('metaStep').classList.add('hidden');
  el('uploadForm').classList.remove('hidden');
  const btn = el<HTMLButtonElement>('uploadBtn');
  btn.disabled = false;
  btn.textContent = 'Encrypt & Upload';
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

el('uploadBtn').addEventListener('click', handlePreview);
el('encryptBtn').addEventListener('click', handleEncrypt);
el('backBtn').addEventListener('click', handleBack);

el('copyBtn').addEventListener('click', async () => {
  const val = el<HTMLInputElement>('link').value;
  await navigator.clipboard.writeText(val);
  const btn = el('copyBtn');
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  setTimeout(() => { btn.textContent = 'Kopieren'; }, 2000);
});

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

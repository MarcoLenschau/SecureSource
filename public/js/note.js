"use strict";
const fromBase64url = (str) => {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '='.repeat((4 - b64.length % 4) % 4);
    return Uint8Array.from(atob(pad), c => c.charCodeAt(0));
};
function showError(msg) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('revealBtn').classList.add('hidden');
    const el = document.getElementById('errorBox');
    el.textContent = msg;
    el.classList.remove('hidden');
}
async function revealNote() {
    document.getElementById('revealBtn').classList.add('hidden');
    document.getElementById('loadingState').classList.remove('hidden');
    const fragment = location.hash.slice(1);
    const parts = fragment.split('.');
    if (parts.length !== 3)
        return showError('Ungültiges Link-Format.');
    const [id, keyB64, ivB64] = parts;
    let ciphertextB64;
    try {
        const res = await fetch(`/api/notes/${id}`);
        if (!res.ok)
            return showError('Nachricht nicht gefunden oder wurde bereits gelesen.');
        ({ ciphertext: ciphertextB64 } = await res.json());
    }
    catch {
        return showError('Netzwerkfehler beim Abrufen der Nachricht.');
    }
    try {
        const key = await crypto.subtle.importKey('raw', fromBase64url(keyB64), { name: 'AES-GCM' }, false, ['decrypt']);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64url(ivB64) }, key, fromBase64url(ciphertextB64));
        document.getElementById('loadingState').classList.add('hidden');
        const box = document.getElementById('messageBox');
        box.textContent = new TextDecoder().decode(decrypted);
        box.classList.remove('hidden');
        document.getElementById('destroyedNote').classList.remove('hidden');
    }
    catch {
        showError('Entschlüsselung fehlgeschlagen — der Link könnte beschädigt sein.');
    }
}
async function init() {
    const fragment = location.hash.slice(1);
    if (!fragment)
        return showError('Ungültiger Link — kein Schlüssel im Fragment.');
    const parts = fragment.split('.');
    if (parts.length !== 3)
        return showError('Ungültiges Link-Format.');
    const [id] = parts;
    document.getElementById('loadingState').classList.remove('hidden');
    try {
        const res = await fetch(`/api/notes/${id}`, { method: 'HEAD' });
        document.getElementById('loadingState').classList.add('hidden');
        if (!res.ok)
            return showError('Nachricht wurde nicht gefunden.');
        document.getElementById('revealBtn').classList.remove('hidden');
    }
    catch {
        showError('Netzwerkfehler beim Überprüfen der Nachricht.');
    }
}
document.getElementById('revealBtn').addEventListener('click', revealNote);
init();

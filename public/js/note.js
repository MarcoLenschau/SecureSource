"use strict";
const fromBase64url = (str) => {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '='.repeat((4 - b64.length % 4) % 4);
    return Uint8Array.from(atob(pad), c => c.charCodeAt(0));
};
const el = (id) => document.getElementById(id);
function showError(msg) {
    el('loadingState').classList.add('hidden');
    el('revealWrapper').classList.add('hidden');
    el('errorBox').textContent = msg;
    el('errorBox').classList.remove('hidden');
}
async function revealNote() {
    el('revealWrapper').classList.add('hidden');
    el('loadingState').classList.remove('hidden');
    const parts = location.hash.slice(1).split('.');
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
        el('loadingState').classList.add('hidden');
        el('messageBox').textContent = new TextDecoder().decode(decrypted);
        el('messageBox').classList.remove('hidden');
        el('destroyedNote').classList.remove('hidden');
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
    el('loadingState').classList.remove('hidden');
    try {
        const res = await fetch(`/api/notes/${parts[0]}`, { method: 'HEAD' });
        el('loadingState').classList.add('hidden');
        if (!res.ok)
            return showError('Nachricht wurde nicht gefunden.');
        el('revealWrapper').classList.remove('hidden');
    }
    catch {
        showError('Netzwerkfehler beim Überprüfen der Nachricht.');
    }
}
el('revealBtn').addEventListener('click', revealNote);
init();

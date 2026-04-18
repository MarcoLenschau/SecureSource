import express from 'express';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import { store } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MAX_CIPHERTEXT_BYTES = 64 * 1024;

const app = express();
app.use(express.json({ limit: '70kb' }));
app.use(express.static(PUBLIC_DIR));

app.post('/api/notes', (req, res) => {
  const { ciphertext } = req.body as { ciphertext?: string };

  if (!ciphertext || typeof ciphertext !== 'string') {
    res.status(400).json({ error: 'Invalid ciphertext' });
    return;
  }

  if (Buffer.byteLength(ciphertext) > MAX_CIPHERTEXT_BYTES) {
    res.status(413).json({ error: 'Ciphertext too large' });
    return;
  }

  const id = randomBytes(8).toString('hex');
  store.set(id, { ciphertext, createdAt: Date.now() });
  res.status(201).json({ id });
});

app.head('/api/notes/:id', (req, res) => {
  res.sendStatus(store.has(req.params.id) ? 200 : 404);
});

app.get('/api/notes/:id', (req, res) => {
  const note = store.getAndDelete(req.params.id);
  if (!note) {
    res.status(404).json({ error: 'Note not found or already read' });
    return;
  }
  res.json({ ciphertext: note.ciphertext });
});

app.get('/note/:id', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'note.html'));
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

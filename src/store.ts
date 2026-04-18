export interface Note {
  ciphertext: string;
  createdAt: number;
}

const TTL_MS = 24 * 60 * 60 * 1000;

class NoteStore {
  private notes = new Map<string, Note>();

  constructor() {
    setInterval(() => this.evictExpired(), 60 * 60 * 1000);
  }

  set(id: string, note: Note): void {
    this.notes.set(id, note);
  }

  getAndDelete(id: string): Note | undefined {
    const note = this.notes.get(id);
    if (note) this.notes.delete(id);
    return note;
  }

  has(id: string): boolean {
    return this.notes.has(id);
  }

  private evictExpired(): void {
    const cutoff = Date.now() - TTL_MS;
    for (const [id, note] of this.notes) {
      if (note.createdAt < cutoff) this.notes.delete(id);
    }
  }
}

export const store = new NoteStore();

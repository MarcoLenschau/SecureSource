export interface EncryptedFile {
  ciphertext: string;
  createdAt: number;
}

const TTL_MS = 24 * 60 * 60 * 1000;

class FileStore {
  private files = new Map<string, EncryptedFile>();

  constructor() {
    setInterval(() => this.evictExpired(), 60 * 60 * 1000);
  }

  set(id: string, file: EncryptedFile): void {
    this.files.set(id, file);
  }

  getAndDelete(id: string): EncryptedFile | undefined {
    const file = this.files.get(id);
    if (file) this.files.delete(id);
    return file;
  }

  has(id: string): boolean {
    return this.files.has(id);
  }

  private evictExpired(): void {
    const cutoff = Date.now() - TTL_MS;
    for (const [id, file] of this.files) {
      if (file.createdAt < cutoff) this.files.delete(id);
    }
  }
}

export const fileStore = new FileStore();

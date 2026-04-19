import { store, Note } from '../store.js';

describe('NoteStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    store['notes'].clear();
  });

  describe('set', () => {
    it('should store a note with id and content', () => {
      const note: Note = { ciphertext: 'test123', createdAt: Date.now() };
      store.set('note1', note);

      expect(store.has('note1')).toBe(true);
    });

    it('should overwrite an existing note with the same id', () => {
      const note1: Note = { ciphertext: 'test1', createdAt: Date.now() };
      const note2: Note = { ciphertext: 'test2', createdAt: Date.now() };

      store.set('note1', note1);
      store.set('note1', note2);

      const retrieved = store.getAndDelete('note1');
      expect(retrieved?.ciphertext).toBe('test2');
    });

    it('should handle multiple notes', () => {
      const note1: Note = { ciphertext: 'test1', createdAt: Date.now() };
      const note2: Note = { ciphertext: 'test2', createdAt: Date.now() };

      store.set('note1', note1);
      store.set('note2', note2);

      expect(store.has('note1')).toBe(true);
      expect(store.has('note2')).toBe(true);
    });
  });

  describe('getAndDelete', () => {
    it('should retrieve and delete a note in one operation', () => {
      const note: Note = { ciphertext: 'secret', createdAt: Date.now() };
      store.set('note1', note);

      const retrieved = store.getAndDelete('note1');

      expect(retrieved).toEqual(note);
      expect(store.has('note1')).toBe(false);
    });

    it('should return undefined for non-existent notes', () => {
      const result = store.getAndDelete('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should not delete a note if it was not found', () => {
      const note: Note = { ciphertext: 'secret', createdAt: Date.now() };
      store.set('note1', note);

      store.getAndDelete('note2'); // Attempt to get non-existent note

      expect(store.has('note1')).toBe(true); // Original note should still exist
    });

    it('should return the exact note object stored', () => {
      const now = Date.now();
      const note: Note = { ciphertext: 'encrypted_data_xyz', createdAt: now };
      store.set('testid', note);

      const retrieved = store.getAndDelete('testid');

      expect(retrieved?.ciphertext).toBe('encrypted_data_xyz');
      expect(retrieved?.createdAt).toBe(now);
    });
  });

  describe('has', () => {
    it('should return true for existing notes', () => {
      const note: Note = { ciphertext: 'test', createdAt: Date.now() };
      store.set('note1', note);

      expect(store.has('note1')).toBe(true);
    });

    it('should return false for non-existent notes', () => {
      expect(store.has('nonexistent')).toBe(false);
    });

    it('should return false after a note has been deleted', () => {
      const note: Note = { ciphertext: 'test', createdAt: Date.now() };
      store.set('note1', note);

      store.getAndDelete('note1');

      expect(store.has('note1')).toBe(false);
    });

    it('should return true immediately after storing', () => {
      const note: Note = { ciphertext: 'instant', createdAt: Date.now() };
      store.set('instant', note);

      expect(store.has('instant')).toBe(true);
    });
  });

  describe('evictExpired', () => {
    it('should remove notes older than 24 hours', () => {
      const now = Date.now();
      const TTL_MS = 24 * 60 * 60 * 1000;
      const expiredTime = now - TTL_MS - 1000; // 1 second older than TTL

      const expiredNote: Note = { ciphertext: 'old', createdAt: expiredTime };
      const freshNote: Note = { ciphertext: 'new', createdAt: now };

      store.set('old', expiredNote);
      store.set('new', freshNote);

      // Call the private evictExpired method via reflection
      (store as any).evictExpired();

      expect(store.has('old')).toBe(false);
      expect(store.has('new')).toBe(true);
    });

    it('should keep notes exactly at the TTL boundary', () => {
      const now = Date.now();
      const TTL_MS = 24 * 60 * 60 * 1000;
      const boundaryNote: Note = { ciphertext: 'boundary', createdAt: now - TTL_MS };

      store.set('boundary', boundaryNote);

      (store as any).evictExpired();

      expect(store.has('boundary')).toBe(true); // Still valid (not < cutoff)
    });

    it('should remove multiple expired notes', () => {
      const now = Date.now();
      const TTL_MS = 24 * 60 * 60 * 1000;
      const expiredTime = now - TTL_MS - 1000;

      store.set('expired1', { ciphertext: 'old1', createdAt: expiredTime });
      store.set('expired2', { ciphertext: 'old2', createdAt: expiredTime });
      store.set('fresh', { ciphertext: 'new', createdAt: now });

      (store as any).evictExpired();

      expect(store.has('expired1')).toBe(false);
      expect(store.has('expired2')).toBe(false);
      expect(store.has('fresh')).toBe(true);
    });

    it('should not evict any notes if all are fresh', () => {
      const now = Date.now();
      store.set('fresh1', { ciphertext: 'new1', createdAt: now });
      store.set('fresh2', { ciphertext: 'new2', createdAt: now });

      (store as any).evictExpired();

      expect(store.has('fresh1')).toBe(true);
      expect(store.has('fresh2')).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle a complete lifecycle: set -> has -> getAndDelete', () => {
      const note: Note = { ciphertext: 'lifecycle_test', createdAt: Date.now() };

      store.set('lifecycle', note);
      expect(store.has('lifecycle')).toBe(true);

      const retrieved = store.getAndDelete('lifecycle');
      expect(retrieved).toEqual(note);
      expect(store.has('lifecycle')).toBe(false);
    });

    it('should handle concurrent operations on different notes', () => {
      const note1: Note = { ciphertext: 'test1', createdAt: Date.now() };
      const note2: Note = { ciphertext: 'test2', createdAt: Date.now() };

      store.set('note1', note1);
      store.set('note2', note2);

      const result1 = store.getAndDelete('note1');

      expect(result1).toEqual(note1);
      expect(store.has('note1')).toBe(false);
      expect(store.has('note2')).toBe(true);

      const result2 = store.getAndDelete('note2');
      expect(result2).toEqual(note2);
    });
  });
});

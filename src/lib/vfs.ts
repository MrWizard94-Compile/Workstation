import { openDB } from 'idb';

const DB_NAME = 'forge_vfs';
const STORE_NAME = 'files';

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    },
  });
}

export interface VFile {
  path: string;
  content: string;
  updatedAt: number;
}

export async function readDir(): Promise<VFile[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function readFile(path: string): Promise<string> {
  const db = await getDB();
  const file = await db.get(STORE_NAME, path);
  if (!file) throw new Error(`File not found: ${path}`);
  return file.content;
}

export async function writeFile(path: string, content: string): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, {
    path,
    content,
    updatedAt: Date.now(),
  });
}

export async function deleteFile(path: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, path);
}

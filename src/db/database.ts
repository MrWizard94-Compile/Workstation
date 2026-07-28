import Dexie, { type EntityTable } from 'dexie';
import type { Thread, Message } from '../types';

const db = new Dexie('HellForgeDB') as Dexie & {
  threads: EntityTable<Thread, 'id'>;
  messages: EntityTable<Message, 'id'>;
};

// We add a 'vectorized' index for mock quarrying/vector search simulation in local environment.
db.version(1).stores({
  threads: 'id, updatedAt',
  messages: 'id, threadId, timestamp, content'
});

export { db };

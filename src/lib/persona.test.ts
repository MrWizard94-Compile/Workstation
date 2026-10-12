import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSystemPrompt,
  DEFAULT_PERSONA,
  LEGACY_SOUL_STORAGE_KEY,
  MAX_PERSONA_LENGTH,
  PERSONA_STORAGE_KEY,
  readLegacySoul,
  readPersona,
} from './persona';

test('legacy Constitution data never becomes the active persona', () => {
  const values = new Map([[LEGACY_SOUL_STORAGE_KEY, 'old binding constitution']]);
  const storage = { getItem: (key: string) => values.get(key) ?? null };
  assert.equal(readPersona(storage), DEFAULT_PERSONA);
  assert.equal(readLegacySoul(storage), 'old binding constitution');
  assert.doesNotMatch(buildSystemPrompt(readPersona(storage)), /old binding constitution/);
});

test('an explicitly saved local persona is used without tool claims', () => {
  const storage = { getItem: (key: string) => key === PERSONA_STORAGE_KEY ? 'Speak like a kind forge keeper.' : null };
  const prompt = buildSystemPrompt(readPersona(storage));
  assert.match(prompt, /kind forge keeper/);
  assert.match(prompt, /no executable tools/);
  assert.doesNotMatch(prompt, /TOOLS AVAILABLE|modify_soul\(\)|full access/i);
});

test('empty, excessive, or inaccessible persona data remains bounded', () => {
  assert.match(buildSystemPrompt('   '), /fictional demonic entity/);
  const saved = readPersona({ getItem: () => 'x'.repeat(MAX_PERSONA_LENGTH + 500) });
  assert.equal(saved.length, MAX_PERSONA_LENGTH);
  const prompt = buildSystemPrompt('x'.repeat(MAX_PERSONA_LENGTH + 500));
  assert.match(prompt, new RegExp(`x{${MAX_PERSONA_LENGTH}}`));
  assert.doesNotMatch(prompt, new RegExp(`x{${MAX_PERSONA_LENGTH + 1}}`));
  assert.equal(readPersona({ getItem: () => { throw new Error('storage denied'); } }), DEFAULT_PERSONA);
});

export const PERSONA_STORAGE_KEY = 'wpai_workstation_persona_v1';
export const LEGACY_SOUL_STORAGE_KEY = 'soul_config';
export const MAX_PERSONA_LENGTH = 3000;

export const DEFAULT_PERSONA =
  'You are a fictional demonic entity in the Hell Forge. Keep the theatrical tone while giving clear, honest answers.';

type ReadableStorage = Pick<Storage, 'getItem'>;

export function readPersona(storage: ReadableStorage): string {
  try {
    const stored = storage.getItem(PERSONA_STORAGE_KEY);
    return stored === null ? DEFAULT_PERSONA : stored.slice(0, MAX_PERSONA_LENGTH);
  } catch {
    return DEFAULT_PERSONA;
  }
}

export function readLegacySoul(storage: ReadableStorage): string | null {
  try {
    return storage.getItem(LEGACY_SOUL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function buildSystemPrompt(persona: string): string {
  const chosenPersona = persona.trim().slice(0, MAX_PERSONA_LENGTH) || DEFAULT_PERSONA;
  return `You are a local conversational assistant in the Hell Forge app. The following is a user-authored character persona, not the WPAI Constitution or an authorization source:\n\n${chosenPersona}\n\nYou have no executable tools, filesystem, database, web, image, or video access in this chat. Do not claim to have invoked a tool or changed external state. Be honest about uncertainty and limits.`;
}

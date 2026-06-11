// Vordefinierte Avatar-Auswahl (Kahoot-Stil) – kein eigener Upload möglich.
export const AVATARS = [
  "🦫", "🫎", "🐶", "🐱", "🐭", "🐰",
  "🦊", "🐺", "🦝", "🐼", "🐸", "🦉",
  "🐥", "🦜", "🐧", "🐻‍❄️", "⛄️", "🐫",
  "🐯", "🐨", "🦘", "🐴", "🦄", "🐲",
  "👹", "🧌", "🧠", "🧟", "💀", "🌍",
] as const;

export function isValidAvatar(value: unknown): value is string {
  return typeof value === "string" && (AVATARS as readonly string[]).includes(value);
}

export function randomAvatar(except?: string | null): string {
  const pool = (AVATARS as readonly string[]).filter((a) => a !== except);
  return pool[Math.floor(Math.random() * pool.length)];
}

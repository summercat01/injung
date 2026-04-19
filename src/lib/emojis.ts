export const EMOJI_OPTIONS = [
  '🙂', '😎', '🤔', '😤', '🥸', '🤓', '😏', '🥹',
  '🤩', '🫡', '🤪', '😈', '🧐', '🫠', '😇', '🤯',
] as const;

export type AvatarEmoji = typeof EMOJI_OPTIONS[number];

export function isValidEmoji(v: unknown): v is AvatarEmoji {
  return typeof v === 'string' && (EMOJI_OPTIONS as readonly string[]).includes(v);
}

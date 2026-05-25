export const WELL_KNOWN_CHAT_I18N_KEYS = {
  support: 'home.chatName.support',
} as const;

export type WellKnownChatI18nKey =
  (typeof WELL_KNOWN_CHAT_I18N_KEYS)[keyof typeof WELL_KNOWN_CHAT_I18N_KEYS];

export const resolveWellKnownChatKey = (
  name?: string | null,
): WellKnownChatI18nKey | null => {
  const normalized = name?.trim().toLowerCase();
  if (!normalized) return null;
  return (
    WELL_KNOWN_CHAT_I18N_KEYS[
      normalized as keyof typeof WELL_KNOWN_CHAT_I18N_KEYS
    ] ?? null
  );
};

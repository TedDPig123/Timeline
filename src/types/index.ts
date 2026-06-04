export type ContentType = "TEXT" | "IMAGE" | "VIDEO" | "AUDIO";

// Client-side-encryption wrapping bundle stored per user. All values are
// base64 strings the server keeps but cannot read user data with.
export interface CryptoBundle {
  crypto_version: number;
  passphrase_salt: string;
  recovery_salt: string;
  wrapped_dek_passphrase: string;
  wrapped_dek_passphrase_iv: string;
  wrapped_dek_recovery: string;
  wrapped_dek_recovery_iv: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  user_id: string;
  date: string;
  created_at: string;
  memory_cards: MemoryCard[];
}

// Render data for a card. Future card features (font, fontSize, color, ...)
// get added here so new cards can carry them without a schema change.
export interface CardStyle {
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

export interface MemoryCard {
  id: string;
  type: ContentType;
  content: string;
  // IV for client-side-encrypted TEXT content. Null/absent = legacy plaintext.
  content_iv?: string | null;
  date: string;
  style: CardStyle;
  user_id: string;
  memory_id: string;
}

import { CardStyle, CryptoBundle, MemoryCard } from "@/types";
import { encryptText, decryptText, encryptFile } from "./crypto";

const API_URL = import.meta.env.PROD
  ? "https://timeline-production-600c.up.railway.app/api"
  : "http://localhost:3001/api";

// Decrypt a card's TEXT content with the session DEK. Cards without a
// content_iv are legacy plaintext and returned unchanged. Media cards (whose
// content is an S3 presigned URL) are also returned unchanged.
async function decryptCard(
  card: MemoryCard,
  dek: CryptoKey,
): Promise<MemoryCard> {
  if (card.type !== "TEXT" || !card.content_iv) return card;
  try {
    const content = await decryptText(card.content, card.content_iv, dek);
    return { ...card, content };
  } catch {
    return { ...card, content: "[unable to decrypt]" };
  }
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// authentication
export function loginWithGoogle() {
  window.location.href = `${API_URL}/auth/google`;
}

// crypto wrapping bundle
export async function getCryptoBundle(): Promise<CryptoBundle | null> {
  const res = await fetch(`${API_URL}/crypto/bundle`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function saveCryptoBundle(
  bundle: Omit<CryptoBundle, "crypto_version">,
) {
  const res = await fetch(`${API_URL}/crypto/bundle`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(bundle),
  });
  return res.json();
}

// memories
export async function getAllMemories(dek: CryptoKey) {
  const res = await fetch(`${API_URL}/memories`, {
    headers: authHeaders(),
  });
  const memories = await res.json();
  if (!Array.isArray(memories)) return memories;
  for (const memory of memories) {
    memory.memory_cards = await Promise.all(
      (memory.memory_cards ?? []).map((c: MemoryCard) => decryptCard(c, dek)),
    );
  }
  return memories;
}

export async function getMemory(date: string, dek: CryptoKey) {
  const res = await fetch(`${API_URL}/memories/${date}`, {
    headers: authHeaders(),
  });
  const memory = await res.json();
  if (memory && memory.memory_cards) {
    memory.memory_cards = await Promise.all(
      memory.memory_cards.map((c: MemoryCard) => decryptCard(c, dek)),
    );
  }
  return memory;
}

export async function createMemory(date: string) {
  const res = await fetch(`${API_URL}/memories`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ date }),
  });
  return res.json();
}

export async function deleteMemory(id: string) {
  const res = await fetch(`${API_URL}/memories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
}

// memcards
// Note: cards are always created via createCardWithFile, which encrypts content
// client-side. There is intentionally no plaintext-content create path.

export async function updateCardStyle(id: string, style: CardStyle) {
  const res = await fetch(`${API_URL}/cards/style/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ style }),
  });
  return res.json();
}

// Replace a TEXT card's content with ciphertext (migration). content is base64.
export async function updateCardContent(
  id: string,
  content: string,
  content_iv: string,
) {
  const res = await fetch(`${API_URL}/cards/content/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ content, content_iv }),
  });
  return res.json();
}

// Replace a media card's stored file with its encrypted bytes (migration).
export async function updateCardFileContent(
  id: string,
  ciphertext: ArrayBuffer,
  content_iv: string,
) {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", new Blob([ciphertext]), "enc");
  formData.append("content_iv", content_iv);
  const res = await fetch(`${API_URL}/cards/content/${id}`, {
    method: "PATCH",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
  return res.json();
}

export async function deleteCard(id: string) {
  const res = await fetch(`${API_URL}/cards/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
}

export async function createCardWithFile(
  data: {
    type: string;
    content?: string;
    file?: File;
    date: string;
    style: CardStyle;
    memory_id: string;
  },
  dek: CryptoKey,
) {
  const token = getToken();
  const formData = new FormData();

  formData.append("type", data.type);
  formData.append("date", data.date);
  // style is a nested object; multipart fields are strings, so JSON-encode it
  formData.append("style", JSON.stringify(data.style));
  formData.append("memory_id", data.memory_id);

  if (data.file) {
    // Encrypt file bytes client-side; upload only ciphertext. A generic name
    // keeps the original filename out of the server / S3 key.
    const plainBytes = await data.file.arrayBuffer();
    const { ciphertext, iv } = await encryptFile(
      plainBytes,
      data.file.type,
      dek,
    );
    formData.append("file", new Blob([ciphertext]), "enc");
    formData.append("content_iv", iv);
  } else if (data.type === "TEXT" && data.content) {
    // Encrypt TEXT content client-side; the server only ever sees ciphertext.
    const { ciphertext, iv } = await encryptText(data.content, dek);
    formData.append("content", ciphertext);
    formData.append("content_iv", iv);
  } else if (data.content) {
    formData.append("content", data.content);
  }

  const res = await fetch(`${API_URL}/cards`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      // Don't set Content-Type - browser will set it with boundary for FormData
    },
    body: formData,
  });
  const card = await res.json();
  // The server echoes back the ciphertext; restore the plaintext we just sent
  // so the new card renders correctly in-session.
  if (data.type === "TEXT" && data.content) {
    card.content = data.content;
  }
  return card;
}

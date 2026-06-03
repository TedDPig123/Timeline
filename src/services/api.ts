import { CardStyle, CryptoBundle } from "@/types";

const API_URL = import.meta.env.PROD
  ? "https://timeline-production-600c.up.railway.app/api"
  : "http://localhost:3001/api";

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
export async function getAllMemories() {
  const res = await fetch(`${API_URL}/memories`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function getMemory(date: string) {
  const res = await fetch(`${API_URL}/memories/${date}`, {
    headers: authHeaders(),
  });
  return res.json();
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
export async function createCard(data: {
  type: string;
  content: string;
  date: string;
  style: CardStyle;
  memory_id: string;
}) {
  const res = await fetch(`${API_URL}/cards`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCardStyle(id: string, style: CardStyle) {
  const res = await fetch(`${API_URL}/cards/style/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ style }),
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

export async function createCardWithFile(data: {
  type: string;
  content?: string;
  file?: File;
  date: string;
  style: CardStyle;
  memory_id: string;
}) {
  const token = getToken();
  const formData = new FormData();

  formData.append("type", data.type);
  formData.append("date", data.date);
  // style is a nested object; multipart fields are strings, so JSON-encode it
  formData.append("style", JSON.stringify(data.style));
  formData.append("memory_id", data.memory_id);

  if (data.file) {
    formData.append("file", data.file);
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
  return res.json();
}

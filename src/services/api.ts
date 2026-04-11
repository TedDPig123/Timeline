const API_URL = "http://localhost:3001/api";

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
  position_x: number;
  position_y: number;
  z_index: number;
  width: number;
  height: number;
  memory_id: string;
}) {
  const res = await fetch(`${API_URL}/cards`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCardPosition(
  id: string,
  position: { position_x: number; position_y: number; z_index: number },
) {
  const res = await fetch(`${API_URL}/cards/position/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(position),
  });
  return res.json();
}

export async function updateCardSize(
  id: string,
  size: { width: number; height: number },
) {
  const res = await fetch(`${API_URL}/cards/size/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(size),
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

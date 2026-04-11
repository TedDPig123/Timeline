export type ContentType = "TEXT" | "IMAGE" | "VIDEO" | "AUDIO";

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

export interface MemoryCard {
  id: string;
  type: ContentType;
  content: string;
  date: string;
  position_x: number;
  position_y: number;
  z_index: number;
  width: number;
  height: number;
  user_id: string;
  memory_id: string;
}

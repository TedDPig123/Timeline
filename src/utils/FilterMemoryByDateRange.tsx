import { MemoryCard } from "../types";

export class thumbnailInfo {
  text: string | null;
  image: string | null;
  date: string | null;
  constructor(text: string | null, image: string | null, date: string | null) {
    this.text = text;
    this.image = image;
    this.date = date;
  }
}

// Helper to convert MemoryCards to thumbnailInfo
function cardsToThumbnails(cards: MemoryCard[]): thumbnailInfo[] {
  const thumbnailInfoArray: thumbnailInfo[] = [];

  for (const card of cards) {
    const text = card.type === "TEXT" ? card.content : null;
    const image = card.type === "IMAGE" ? card.content : null;

    // Look for existing thumbnailInfo for this date
    let existingThumbnail = thumbnailInfoArray.find(
      (thumbnail) => thumbnail.date === card.date.split("T")[0]
    );

    if (!existingThumbnail) {
      existingThumbnail = new thumbnailInfo(null, null, card.date.split("T")[0]);
      thumbnailInfoArray.push(existingThumbnail);
    }

    if (text && !existingThumbnail.text) {
      existingThumbnail.text = text;
    }
    if (image && !existingThumbnail.image) {
      existingThumbnail.image = image;
    }

    if (!existingThumbnail.text && !existingThumbnail.image) {
      existingThumbnail.text = "no preview";
    }
  }

  return thumbnailInfoArray;
}

// These now take memoryCards as a parameter instead of using mock data
export function filterMemoryByWeek(
  startDate: string,
  memoryCards: MemoryCard[]
): thumbnailInfo[] {
  const date = new Date(startDate);
  const dayOfWeek = date.getDay();
  const mondayOffset = dayOfWeek === 1 ? 0 : 1 - dayOfWeek;

  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() + mondayOffset);

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDates.push(d.toISOString().split("T")[0]);
  }

  const weeklyMemoryCards = memoryCards.filter((card) =>
    weekDates.includes(card.date.split("T")[0])
  );

  return cardsToThumbnails(weeklyMemoryCards);
}

export function filterMemoryByMonth(
  startDate: string,
  memoryCards: MemoryCard[]
): thumbnailInfo[] {
  const date = new Date(startDate);
  const year = date.getFullYear();
  const month = date.getMonth();

  const monthlyMemoryCards = memoryCards.filter((card) => {
    const cardDate = new Date(card.date);
    return cardDate.getFullYear() === year && cardDate.getMonth() === month;
  });

  return cardsToThumbnails(monthlyMemoryCards);
}

export function filterMemoryByYear(
  startDate: string,
  memoryCards: MemoryCard[]
): thumbnailInfo[] {
  const date = new Date(startDate);
  const year = date.getFullYear();

  const yearlyMemoryCards = memoryCards.filter((card) => {
    const cardDate = new Date(card.date);
    return cardDate.getFullYear() === year;
  });

  return cardsToThumbnails(yearlyMemoryCards);
}

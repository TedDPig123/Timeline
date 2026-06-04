import { MemoryCard } from "../../types";
import MediaContent from "./MediaContent";

interface MemoryModuleProps {
  card: MemoryCard;
}

// Displays a card by type. TEXT content arrives already decrypted; media is
// decrypted on the fly by MediaContent.
export default function MemoryModule({ card }: MemoryModuleProps) {
  if (card.type === "TEXT") {
    return (
      <div className="text-memory h-full overflow-auto">
        <p>{card.content}</p>
      </div>
    );
  }

  return (
    <div className={`${card.type.toLowerCase()}-memory h-full`}>
      <MediaContent card={card} />
    </div>
  );
}

export { MemoryModule };

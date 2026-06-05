import { MemoryCard } from "../../types";
import { useDecryptedMedia } from "../../hooks/useDecryptedMedia";

// Renders an IMAGE/VIDEO/AUDIO card, decrypting its content on the fly when the
// card is encrypted (content_iv set). Legacy plaintext cards use the presigned
// URL directly.
export default function MediaContent({ card }: { card: MemoryCard }) {
  const src = useDecryptedMedia(card.content, card.content_iv);

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs opacity-50">
        Decrypting…
      </div>
    );
  }

  switch (card.type) {
    case "IMAGE":
      return (
        <img
          src={src}
          alt="memory"
          className="h-full w-full rounded object-cover"
          onDragStart={(event) => event.preventDefault()}
        />
      );
    case "AUDIO":
      return (
        <div className="flex h-full w-full items-center justify-center">
          <audio controls className="w-full" src={src} />
        </div>
      );
    case "VIDEO":
      return (
        <video
          controls
          className="h-full w-full rounded object-cover"
          src={src}
        />
      );
    default:
      return null;
  }
}

import { MemoryCard, Memory } from "@/types";
import {
  getAllMemories,
  updateCardContent,
  updateCardFileContent,
} from "./api";
import { encryptText, encryptFile } from "./crypto";

// Runs once per page load (reset on reload). Guards against the unlock and
// setup paths both triggering it, and against route remounts re-running it.
let started = false;

// Re-encrypt any legacy plaintext cards (content_iv == null) in place. Runs in
// the background after unlock. Idempotent and resumable: each card is only
// marked encrypted once its ciphertext is stored, so a failure leaves the card
// as readable plaintext to retry on the next unlock.
export async function migrateLegacyCards(dek: CryptoKey): Promise<void> {
  if (started) return;
  started = true;

  try {
    const memories: Memory[] = await getAllMemories(dek);
    if (!Array.isArray(memories)) return;

    // getAllMemories returns legacy TEXT cards as plaintext (content_iv null)
    // and legacy media cards with a presigned URL to the plaintext file.
    const legacy = memories
      .flatMap((m) => m.memory_cards ?? [])
      .filter((c: MemoryCard) => !c.content_iv);

    if (legacy.length === 0) return;
    console.log(`Migrating ${legacy.length} legacy card(s) to encrypted form…`);

    let done = 0;
    for (const card of legacy) {
      try {
        if (card.type === "TEXT") {
          const { ciphertext, iv } = await encryptText(card.content, dek);
          await updateCardContent(card.id, ciphertext, iv);
        } else {
          // card.content is a presigned URL to the legacy plaintext file
          const res = await fetch(card.content);
          const bytes = await res.arrayBuffer();
          const mime =
            res.headers.get("content-type") || "application/octet-stream";
          const { ciphertext, iv } = await encryptFile(bytes, mime, dek);
          await updateCardFileContent(card.id, ciphertext, iv);
        }
        done++;
      } catch (err) {
        // Leave this card as plaintext; it'll be retried next unlock.
        console.error(`Failed to migrate card ${card.id}:`, err);
      }
    }
    console.log(`Migration complete: ${done}/${legacy.length} card(s).`);
  } catch (err) {
    console.error("Legacy migration failed to start:", err);
    started = false; // allow a retry on the next unlock
  }
}

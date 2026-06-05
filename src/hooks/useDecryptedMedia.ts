import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { decryptFile } from "../services/crypto";

// Resolves a displayable src for media content.
// - No url -> null.
// - url but no iv -> legacy plaintext: the presigned URL is used directly.
// - url + iv -> fetch the ciphertext, decrypt with the session DEK, and return
//   a Blob object URL (revoked on unmount / input change).
export function useDecryptedMedia(
  url: string | null,
  iv: string | null | undefined,
): string | null {
  const { dek } = useAuth();
  const [src, setSrc] = useState<string | null>(iv ? null : url);

  useEffect(() => {
    if (!url) {
      setSrc(null);
      return;
    }
    if (!iv) {
      setSrc(url); // legacy plaintext file
      return;
    }
    if (!dek) {
      setSrc(null);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    (async () => {
      try {
        const res = await fetch(url);
        const ciphertext = await res.arrayBuffer();
        const blob = await decryptFile(ciphertext, iv, dek);
        objectUrl = URL.createObjectURL(blob);
        if (active) setSrc(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      } catch {
        if (active) setSrc(null);
      }
    })();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, iv, dek]);

  return src;
}

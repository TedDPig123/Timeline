import { useState } from "react";
import { ContentType } from "../../types";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { type: ContentType; content?: string; file?: File }) => void;
}

export default function AddCardModal({
  isOpen,
  onClose,
  onAdd,
}: AddCardModalProps) {
  const [type, setType] = useState<ContentType>("TEXT");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (type === "TEXT") {
      if (!textContent.trim()) return;
      onAdd({ type, content: textContent });
    } else {
      if (!file) return;
      onAdd({ type, file });
    }

    // Reset form
    setTextContent("");
    setFile(null);
    setType("TEXT");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-[400px] rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">Add New Card</h2>

        {/* Type selector */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Type</label>
          <div className="flex gap-2">
            {(["TEXT", "IMAGE", "VIDEO", "AUDIO"] as ContentType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded px-3 py-1 text-sm ${
                  type === t
                    ? "bg-black text-white"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content input */}
        {type === "TEXT" ? (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Content</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full rounded border border-gray-300 p-2"
              rows={4}
              placeholder="Enter your text..."
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">
              Upload File
            </label>
            <input
              type="file"
              accept={
                type === "IMAGE"
                  ? "image/*"
                  : type === "VIDEO"
                    ? "video/*"
                    : type === "AUDIO"
                      ? "audio/*"
                      : "*"
              }
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full"
            />
            {file && <p className="mt-1 text-sm text-gray-500">{file.name}</p>}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Add Card
          </button>
        </div>
      </div>
    </div>
  );
}

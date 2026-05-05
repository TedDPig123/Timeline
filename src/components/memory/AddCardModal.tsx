import { useState } from "react";
import { ContentType } from "../../types";
import { useThemeContext } from "@/context/context";

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
  const { theme } = useThemeContext();
  const [isHoveredAdd, setIsHoveredAdd] = useState(false);
  const [isHoveredCancel, setIsHoveredCancel] = useState(false);

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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="w-[400px] rounded-lg bg-white p-6 shadow-xl"
        style={{
          backgroundColor: theme.primaryColor,
          border: `2px solid ${theme.secondaryColor}`,
        }}
      >
        <h2 className="mb-4 text-xl font-bold">Add New Card</h2>

        {/* Type selector */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Type</label>
          <div className="flex gap-2">
            {(["TEXT", "IMAGE", "VIDEO", "AUDIO"] as ContentType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`font-helvetica-med rounded px-3 py-1 text-sm font-medium`}
                style={{
                  backgroundColor:
                    type === t ? theme.secondaryColor : theme.primaryColor,
                  color: type === t ? theme.primaryColor : theme.secondaryColor,
                  border:
                    type === t && theme.isDark
                      ? `2px solid ${theme.primaryColor}`
                      : `none`,
                }}
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
              className="w-full rounded p-2"
              style={{
                color: theme.secondaryColor,
                backgroundColor: theme.primaryColor,
                border: `1px solid ${theme.secondaryColor}`,
              }}
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
            onMouseEnter={() => setIsHoveredCancel(true)}
            onMouseLeave={() => setIsHoveredCancel(false)}
            style={{
              color: theme.primaryColor,
              backgroundColor: isHoveredCancel
                ? theme.highlightColor
                : theme.secondaryColor,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            onMouseEnter={() => setIsHoveredAdd(true)}
            onMouseLeave={() => setIsHoveredAdd(false)}
            className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
            style={{
              border: `2px solid ${theme.secondaryColor}`,

              color: theme.isDark
                ? theme.secondaryColor
                : isHoveredAdd
                  ? theme.primaryColor
                  : theme.secondaryColor,
              backgroundColor: isHoveredAdd
                ? theme.highlightColor
                : theme.primaryColor,
            }}
          >
            Add Card
          </button>
        </div>
      </div>
    </div>
  );
}

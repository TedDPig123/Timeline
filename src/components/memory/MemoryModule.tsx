import { ContentType } from "../../types";

interface MemoryModuleProps {
  type: ContentType;
  content: string;
}

export default function MemoryModule({ type, content }: MemoryModuleProps) {
  switch (type) {
    case "TEXT":
      return (
        <div className="text-memory h-full overflow-auto">
          <p>{content}</p>
        </div>
      );
    case "IMAGE":
      return (
        <div className="image-memory h-full">
          <img src={content} alt="memory" className="h-full w-full object-cover rounded" />
        </div>
      );
    case "AUDIO":
      return (
        <div className="audio-memory flex items-center justify-center h-full">
          <audio controls className="w-full">
            <source src={content} type="audio/mpeg" />
          </audio>
        </div>
      );
    case "VIDEO":
      return (
        <div className="video-memory h-full">
          <video controls className="h-full w-full object-cover rounded">
            <source src={content} type="video/mp4" />
          </video>
        </div>
      );
    default:
      return (
        <div className="unknown-memory">
          <p>Unsupported memory type</p>
        </div>
      );
  }
}

export { MemoryModule };

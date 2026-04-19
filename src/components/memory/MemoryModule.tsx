import { ContentType } from "../../types";

interface MemoryModuleProps {
  type: ContentType;
  content: string;
}

//the module takes in the type of the media and its content and displays them accordingly
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
          <img
            src={content}
            alt="memory"
            className="h-full w-full rounded object-cover"
          />
        </div>
      );
    case "AUDIO":
      return (
        <div className="audio-memory flex h-full items-center justify-center">
          <audio controls className="w-full">
            <source src={content} type="audio/mpeg" />
          </audio>
        </div>
      );
    case "VIDEO":
      return (
        <div className="video-memory h-full">
          <video controls className="h-full w-full rounded object-cover">
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

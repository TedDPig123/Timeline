type MemoryModal = {
  id: number;
  type: "text" | "image";
  content: string;
};

type PreviewCardProp = {
  created: string;
  memoryModals: MemoryModal[];
  onClose: () => void;
  onExpand: () => void;
};

function PreviewCard({
  created,
  memoryModals,
  onClose,
  onExpand,
}: PreviewCardProp) {
  const title = new Date(created).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="relative w-[800px] max-w-[95%] rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between px-1">
          <button
            onClick={onExpand}
            title="Expand"
            className="text-xl text-gray-500 hover:text-black"
          >
            ⤢
          </button>
          <h2 className="-ml-6 flex-1 text-center font-serif text-xl">
            {title}
          </h2>
          <button
            onClick={onClose}
            title="Close"
            className="text-xl text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {memoryModals.map((modal) => {
            if (modal.type === "image") {
              return (
                <img
                  key={modal.id}
                  src={modal.content}
                  alt="memory"
                  className="max-h-[300px] w-full rounded-xl object-contain"
                />
              );
            }

            if (modal.type === "text") {
              return (
                <div
                  key={modal.id}
                  className="w-full rounded-xl border bg-white p-3 text-sm shadow"
                >
                  {modal.content}
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}

export default PreviewCard;

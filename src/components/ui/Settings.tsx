type SettingsButtonProps = {
  isSettingsOpen: boolean;
  onClose: () => void;
};

const Settings = ({ isSettingsOpen, onClose }: SettingsButtonProps) => {
  if (!isSettingsOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay, for blurred background */}
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-10 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>
      <div className="relative z-10 flex w-[400px] flex-col items-center rounded-lg border border-gray-300 bg-white p-8 shadow-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded bg-gray-200 px-2 py-1 text-xs text-white hover:bg-gray-400"
        >
          X
        </button>

        <h2 className="mb-2 font-editorial text-3xl">Settings</h2>
        <p className="text-center text-gray-600">Work in progress.</p>
      </div>
    </div>
  );
};

export { Settings };

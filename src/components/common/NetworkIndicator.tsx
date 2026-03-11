import React, { useSyncExternalStore } from "react";

const subscribe = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

const getSnapshot = () => navigator.onLine;
const getServerSnapshot = () => true;

const NetworkIndicator: React.FC = () => {
  const isOnline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (isOnline) {
    return null; // Hide when online
  }

  return (
    <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-red-600 text-white rounded-md shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-sm font-medium">No internet connection</span>
      </div>
    </div>
  );
};

export default NetworkIndicator;

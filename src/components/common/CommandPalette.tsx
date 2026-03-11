"use client";
import React, { useEffect, useState } from "react";

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" && e.ctrlKey)
      ) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2">
          <input
            type="text"
            placeholder="Type a command or search..."
            className="w-full px-4 py-3 text-base border-0 focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent text-gray-900 dark:text-white outline-none"
            autoFocus
          />
          <div className="max-h-96 overflow-y-auto p-2">
            <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Command palette (placeholder) - Press Ctrl+K or Cmd+K to toggle
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

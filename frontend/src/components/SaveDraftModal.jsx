import React from "react";
import { X } from "lucide-react";

export default function SaveDraftModal({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  isSaving,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Save Draft</h2>
          <p className="text-gray-600">
            Save your changes and come back to finish your article later.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onSave}
            disabled={isSaving}
            className={`w-full py-3 rounded-full font-semibold transition-colors ${
              isSaving
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isSaving ? "Saving..." : "Publish"}
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-full py-3 rounded-full font-semibold border-2 border-blue-500 text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={onDiscard}
            disabled={isSaving}
            className="w-full py-3 rounded-full font-semibold border-2 border-red-500 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

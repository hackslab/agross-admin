import React, { useState } from "react";

export interface FileCardItem {
  id: string;
  url: string;
  name?: string;
  isVideo: boolean;
  isExisting?: boolean; // Flag to differentiate existing vs new files
}

interface DraggableFileCardsProps {
  files: FileCardItem[];
  onReorder: (files: FileCardItem[]) => void;
  onRemove: (fileId: string) => void;
  readonly?: boolean;
}

const DraggableFileCards: React.FC<DraggableFileCardsProps> = ({
  files,
  onReorder,
  onRemove,
  readonly = false,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newFiles = [...files];
    const [draggedFile] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, draggedFile);

    onReorder(newFiles);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (files.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {files.map((file, index) => (
          <div
            key={file.id}
            draggable={!readonly}
            onDragStart={() => handleDragStart(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              relative group bg-white rounded-lg border-2 overflow-hidden
              transition-all duration-200
              ${!readonly ? "cursor-move hover:shadow-lg" : ""}
              ${draggedIndex === index ? "opacity-50 scale-95" : ""}
              ${
                dragOverIndex === index
                  ? "border-teal-500 scale-105 shadow-lg"
                  : "border-gray-200"
              }
            `}
            style={{
              aspectRatio: "1",
            }}
          >
            {/* File Preview */}
            <div className="w-full h-full relative bg-gray-100">
              {file.isVideo ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <svg
                    className="w-12 h-12 text-teal-600 mb-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  <p className="text-xs text-gray-600 text-center truncate w-full px-2">
                    {file.name || "Video"}
                  </p>
                </div>
              ) : (
                <img
                  src={file.url}
                  alt={file.name || "Preview"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center">
                          <svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      `;
                    }
                  }}
                />
              )}

              {/* Order Badge */}
              {!readonly && (
                <div className="absolute top-2 left-2 bg-teal-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shadow-md">
                  {index + 1}
                </div>
              )}

              {/* Existing/New Badge */}
              {file.isExisting && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow-md">
                  Mavjud
                </div>
              )}

              {/* Remove Button */}
              {!readonly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(file.id);
                  }}
                  className="absolute bottom-2 right-2 bg-red-600 text-white border-none rounded-full w-8 h-8 cursor-pointer flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-red-700 hover:scale-110 shadow-md"
                  title="Faylni olib tashlash"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}

              {/* Drag Handle Indicator */}
              {!readonly && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <svg
                    className="w-6 h-6 text-white drop-shadow-lg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </div>
              )}
            </div>

            {/* File Name Tooltip on Hover */}
            {file.name && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate">
                {file.name}
              </div>
            )}
          </div>
        ))}
      </div>

      {!readonly && files.length > 0 && (
        <p className="mt-3 text-sm text-gray-600 italic">
          💡 Tartibni o'zgartirish uchun kartochkalarni sudrab olib keling
        </p>
      )}
    </div>
  );
};

export default DraggableFileCards;

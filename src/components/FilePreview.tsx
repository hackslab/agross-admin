import React from "react";

interface FilePreviewProps {
  files: Array<{ url: string; name?: string }>;
  onRemove: (index: number) => void;
  showImages?: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  files,
  onRemove,
  showImages = true,
}) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {files.map((file, index) => (
        <div
          key={index}
          className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-md border border-gray-200 group hover:bg-gray-100 transition-colors duration-200"
        >
          {showImages && file.url && (
            <div className="shrink-0 w-12 h-12 rounded overflow-hidden bg-gray-200">
              <img
                src={file.url}
                alt={file.name || "Preview"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-gray-700 text-sm truncate">
              {file.name || file.url}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRemove(index)}
            className="shrink-0 bg-red-600 text-white border-none rounded w-8 h-8 cursor-pointer text-xl flex items-center justify-center transition-all duration-200 hover:bg-red-700 hover:scale-110"
            title="Faylni olib tashlash"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default FilePreview;

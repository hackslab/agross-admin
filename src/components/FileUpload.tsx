import React, { useCallback, useState } from "react";

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = "image/*",
  multiple = false,
  maxFiles = 10,
  className = "",
  label = "Upload Files",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const errors: string[] = [];
      const valid: File[] = [];

      if (!multiple && files.length > 1) {
        errors.push("Faqat bitta faylga ruxsat beriladi");
        return { valid: [], errors };
      }

      if (files.length > maxFiles) {
        errors.push(`Maksimal ${maxFiles} ta faylga ruxsat beriladi`);
        return { valid: [], errors };
      }

      files.forEach((file) => {
        if (accept) {
          const acceptedTypes = accept.split(",").map((type) => type.trim());
          const isValid = acceptedTypes.some((type) => {
            // Convert wildcard to regex, e.g., "image/*" -> /image\/.*/
            const regex = new RegExp(type.replace("*", ".*"));
            return regex.test(file.type);
          });

          if (!isValid) {
            errors.push(`${file.name} qabul qilinadigan fayl turi emas`);
          } else {
            valid.push(file);
          }
        } else {
          valid.push(file);
        }
      });

      return { valid, errors };
    },
    [multiple, maxFiles, accept]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const { valid, errors } = validateFiles(fileArray);

      if (errors.length > 0) {
        setError(errors.join(", "));
        setTimeout(() => setError(""), 5000);
      }

      if (valid.length > 0) {
        onFileSelect(valid);
        setError("");
      }
    },
    [onFileSelect, validateFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      handleFiles(files);
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  return (
    <div className={className}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? "border-teal-700 bg-teal-50 scale-[1.02]"
              : "border-gray-300 bg-gray-50 hover:border-teal-600 hover:bg-gray-100"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <svg
            className={`w-12 h-12 transition-colors duration-200 ${
              isDragging ? "text-teal-700" : "text-gray-400"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <div>
            <p className="text-gray-700 font-medium mb-1">
              {isDragging ? "Fayllarni bu yerga tashlang" : label}
            </p>
            <p className="text-gray-500 text-sm">
              yoki ko'rib chiqish uchun bosing
            </p>
          </div>

          <div className="text-xs text-gray-400 mt-2">
            {accept && <p>Ruxsat etilgan: {accept}</p>}
            {multiple && <p>Maks. fayllar: {maxFiles}</p>}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
